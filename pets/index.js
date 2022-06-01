const express = require('express')
const path = require('path')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const uuid = require('uuid')
const morgan = require('morgan')
const { Kafka } = require('kafkajs')

require('dotenv').config() // Will load .env into process.env

const kafka = new Kafka({
  clientId: 'Josh',
  brokers: ['localhost:9092'],
})

const producer = kafka.producer()
// Note, if we try to post a message too soon it may fail as this is asynchronous. May need an internal queue... meh.
producer.connect()
consumePetsAdded()

async function consumePetsAdded() {
    const consumer = kafka.consumer({ groupId: 'pets-db-sink' })

    await consumer.connect()
    await consumer.subscribe({ topic: 'pets.added', fromBeginning: true })
    await consumer.run({
	eachMessage: async ({ topic, partition, message }) => {
	    console.log({
		value: message.value.toString(),
            })
        },
    })
    
}



app.use(cors())
app.use(bodyParser.json())

app.use(morgan('combined'))

const pets = []
app.get('/api/pets', (req, res) => {
    res.json(pets)
})

app.post('/api/pets', (req, res) => {
    const pet = req.body
    pet.id = pet.id || uuid.v4()
    pets.push(pet)

    producer.send({
	topic: 'pets.added',
	messages: [
	    { value: JSON.stringify(pet) },
	],
    })

    res.status(201).send(pet)
})

// SPA
app.use(express.static(path.resolve(__dirname, process.env.SPA_PATH || '../web-ui/build')))

// Start
const server = app.listen(process.env.NODE_PORT || 3100, () => {
  console.log('Server listening on http://' + server.address().address + ':' + server.address().port)
})
