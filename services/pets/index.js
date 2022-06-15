require('dotenv').config() // Will load .env into process.env
const express = require('express')
const path = require('path')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const uuid = require('uuid')
const morgan = require('morgan')
const { Kafka, logLevel } = require('kafkajs')
const { FlatDB, KafkaSink } = require('../lib')

// Configs
const KAFKA_HOSTS = (process.env.KAFKA_HOSTS || 'localhost:9092').split(',').map(s => s.trim())
const DATA_BASEPATH = process.env.DATA_BASEPATH || __dirname
const CLIENT_ID = 'pets'

// ---------------------------------------------------------------
// Kafka
console.log('Connecting to Kafka on: ' + JSON.stringify(KAFKA_HOSTS))
const kafka = new Kafka({
  logLevel: logLevel.INFO,
  brokers: KAFKA_HOSTS,
  clientId: CLIENT_ID,
  retry: {
    initialRetryTime: 1000,
    retries: 16
  }
})

const consumers = []
const producer = kafka.producer()
producer.connect()

// Consume kafka
const petsCache = new KafkaSink({
  kafka,
  basePath: DATA_BASEPATH,
  name: 'pets-cache',
  topics: ['pets.added', 'pets.statusChanged'],
  onLog: ({log, topic, sink}) => {

    if(topic === 'pets.added') {
      console.log(`Adding pet to disk: ${log.id} - ${log.name}`)
      sink.db.dbPut(log.id, {...log, status: 'pending'})

      producer.send({
        topic: 'pets.statusChanged',
        messages: [
          { value: JSON.stringify({ ...log, status: 'available'}) },
        ],
      })
      return 
    }

    if(topic === 'pets.statusChanged') {
      console.log(`Updating pet status to disk: ${log.id} - ${log.status}`)
      // Save to DB with new status
      sink.db.dbMerge(log.id, {status: log.status})
      return 
    }
  }
})

// ---------------------------------------------------------------
// Rest
app.use(morgan('short'))
app.use(cors())
app.use(bodyParser.json())

app.get('/api/pets', (req, res) => {
  const { location, status } = req.query
  if(!location && !status) {
    return res.json(petsCache.db.dbGetAll())
  }

  return res.json(petsCache.db.dbQuery({ location, status }, { caseInsensitive: true }))
})

app.post('/api/pets', (req, res) => {
  const pet = req.body
  pet.id = pet.id || uuid.v4()

  producer.send({
    topic: 'pets.added',
    messages: [
      { value: JSON.stringify(pet) },
    ],
  })

  res.status(201).send(pet)
})

app.patch('/api/pets/:id', (req, res) => {
  const pet = petsCache.db.dbGet(req.params.id)
  const { status } = req.body
  if(!pet)
    res.status(400).json({
      message: 'Pet not found, cannot patch.'
    })

  const updatedPet = {...pet, status }

  producer.send({
    topic: 'pets.statusChanged',
    messages: [
      { value: JSON.stringify(updatedPet) },
    ],
  })

  res.status(201).send(updatedPet)
})

// // SPA
// app.use(express.static(path.resolve(__dirname, process.env.SPA_PATH || '../web-ui/build')))


// ---------------------------------------------------------------------------------------
// Boring stuff follows...
// ---------------------------------------------------------------------------------------

// Start server and handle logic around graceful exit
const server = app.listen(process.env.NODE_PORT || 3100, () => {
  console.log('Server listening on http://' + server.address().address + ':' + server.address().port)
})
// Keep track of connections to kill 'em off later.
let connections = []
server.on('connection', connection => {
  connections.push(connection);
  connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

// Exit gracefully
const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']
errorTypes.forEach(type => {
  process.on(type, async e => {
    try {
      console.log(`process.on ${type}`)
      console.error(e)
      await shutdown()
    } catch (_) {
      process.exit(1)
    }
  })
})


signalTraps.forEach(type => {
  process.once(type, async () => {
    try {
      await shutdown()
    } finally {
      process.kill(process.pid, type)
    }
  })
})


async function shutdown() {
  await Promise.all(consumers.map(consumer => consumer.disconnect()))

  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);

  connections.forEach(curr => curr.end());
  setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
}

