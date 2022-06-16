require('dotenv').config() // Will load .env into process.env
const express = require('express')
const path = require('path')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const uuid = require('uuid')
const morgan = require('morgan')
const { Kafka, logLevel } = require('kafkajs')
const { KafkaSink, KafkaLogger, KafkaStream } = require('../lib')

// Configs
const KAFKA_HOSTS = (process.env.KAFKA_HOSTS || 'localhost:9092').split(',').map(s => s.trim())
const DATA_BASEPATH = process.env.DATA_BASEPATH || __dirname
const CLIENT_ID = 'adoptions'

// ---------------------------------------------------------------
// Kafka
const kafka = new Kafka({
  logLevel: logLevel.INFO,
  logCreator: KafkaLogger,
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
const petCache = new KafkaSink({
  kafka,
  basePath: DATA_BASEPATH,
  name: 'adoptions-pet-status-cache',
  topics: ['pets.statusChanged'],
  onLog: ({log, sink}) => {
    if(!log.status) {
      return 
    }
    console.log(`Cacheing pet status to disk: ${log.id} - ${log.status}`)
    sink.db.dbPut(log.id, {status: log.status})
  }
})


const adoptionsCache = new KafkaSink({
  kafka,
  basePath: DATA_BASEPATH,
  name: 'adoptions-adoptions-requested',
  topics: ['adoptions.requested', 'adoptions.statusChanged'],
  onLog: async ({log, sink, topic}) => {

    if(topic === 'adoptions.requested') {
      // Save to DB
      console.log(`Adding adoption - ${log.id} - pets = ${JSON.stringify(log.pets)}`)
      sink.db.dbPut(log.id, {...log, status: 'pending'})
    }

    if(topic === 'adoptions.statusChanged') {
      const adoption = sink.db.dbGet(log.id)
      if(!adoption)
        throw new Error(`Did not find Adoption with id ${log.id}`)

      console.log(`Saving status - ${log.id} - ${log.status}`)
      sink.db.dbMerge(log.id, {status: log.status})
      return
    }

  }
})

new KafkaStream({
  kafka,
  topics: ['adoptions.requested', 'adoptions.statusChanged'],
  name: 'adoptions-stream',
  onLog: async ({ log, topic }) => {

    if(topic === 'adoptions.requested') {
      // Produce: adoptions.statusChanged
      producer.send({
        topic: 'adoptions.statusChanged',
        messages: [
          { value: JSON.stringify({id: log.id,  status: 'requested'}) },
        ],
      })
      return
    }

    if(topic === 'adoptions.statusChanged') {
      const adoption = adoptionsCache.db.dbGet(log.id)
      if(!adoption)
        throw new Error(`Did not find Adoption with id ${log.id}`)
      console.log(`Processing status change - ${log.id} - ${log.status}`)
      await processStatusChange(adoption, log.status)
      return 
    }
  }
})

// Trigger other events based on status change. And update the status 
// requested -> rejected | available
// available -> denied | adopted
// adopted -> END
// rejected -> END
// denied -> END
async function processStatusChange(adoption, status) {

  // requested -> rejected | available
  if(status === 'requested') {
    
    // available
    // for each pets, hold them
    // update adoption status

    // Hold all pets
    const reasons = adoption.pets
          .map(petId => ({ id: petId, status: petCache.get(petId).status}))
          .filter(({status}) => status !== 'available')
          .map(({id, status}) => ({petId: id, message: `${status}`}))

    // Denied
    if(reasons.length) {
      adoptionsCache.db.dbMerge(adoption.id, {reasons})
      await producer.send({
        topic: 'adoptions.statusChanged',
        messages: [
          { value: JSON.stringify({id: adoption.id, status: 'rejected', reasons}) },
        ],
      })
      // End - Rejected
      return 
    }

    // Available
    const petMessages = adoption.pets.map(petId => ({
        value: JSON.stringify({id: petId, status: 'onhold'}),
    }))

    await producer.send({
      topic: 'pets.statusChanged',
      messages: petMessages
    })

    await producer.send({
      topic: 'adoptions.statusChanged',
      messages: [
        { value: JSON.stringify({id: adoption.id, status: 'available'}) },
      ],
    })

    // End - Available
    return
  }

  // Adopted -> Claim all the Pets
  if(status === 'approved') {
    const claimPetMessages = adoption.pets
          .map(petId => ({
            value: JSON.stringify({
              id: petId,
              status: 'adopted'
            })
          }))

    await producer.send({
      topic: 'pets.statusChanged',
      messages: claimPetMessages
    })

    return 
  }

  if(status === 'denied') {
    const claimPetMessages = adoption.pets
          .map(petId => ({
            value: JSON.stringify({
              id: petId,
              status: 'available'
            })
          }))

    await producer.send({
      topic: 'pets.statusChanged',
      messages: claimPetMessages
    })

    return 
  }


}

// ---------------------------------------------------------------
// Rest
app.use(morgan('short'))
app.use(cors())
app.use(bodyParser.json())

app.get('/api/adoptions', (req, res) => {
  const { location='', status='' } = req.query
  if(!location && !status) {
    return res.json(adoptionsCache.db.dbGetAll())
  }

  let results = adoptionsCache.db.dbQuery({ location, status }, { caseInsensitive: true })
  return res.json(results)
})

app.post('/api/adoptions', (req, res) => {
  const adoption = req.body
  adoption.id = adoption.id || uuid.v4()

  // TODO: Some validation of the body

  producer.send({
    topic: 'adoptions.requested',
    messages: [
      { value: JSON.stringify(adoption) },
    ],
  })

  res.status(201).send(adoption)
})

app.patch('/api/adoptions/:id', (req, res) => {
  const adoption = adoptionsCache.db.dbGet(req.params.id)
  const { status } = req.body
  if(!adoption) {
    console.log('Cannot find adoption ${req.params.id} to patch')
    return res.status(400).json({
      message: 'Adoption not found, cannot patch.'
    })
  }

  const updatedAdoption = {...adoption, status }
  console.log(`Patching ${JSON.stringify(updatedAdoption)}`)

  producer.send({
    topic: 'adoptions.statusChanged',
    messages: [
      { value: JSON.stringify(updatedAdoption) },
    ],
  })

  return res.status(200).send(updatedAdoption)
})

// // SPA
// app.use(express.static(path.resolve(__dirname, process.env.SPA_PATH || '../web-ui/build')))


// ---------------------------------------------------------------------------------------
// Boring stuff follows...
// ---------------------------------------------------------------------------------------

// Start server and handle logic around graceful exit
const server = app.listen(process.env.NODE_PORT || 3200, () => {
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

