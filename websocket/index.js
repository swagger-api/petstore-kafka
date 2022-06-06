require('dotenv').config() // Will load .env into process.env
const WebSocket = require('ws');
const { Kafka, logLevel } = require('kafkajs')

const PORT = process.env.NODE_PORT || 3300
const BROKERS = process.env.BROKERS || ['localhost:9092']
const CLIENT_ID = 'pets'

// Global state
let sockets = []
const socketsForLocation = {}
let consumer, producer


// ---------------------------------------------------------------
// Kafka
const kafka = new Kafka({
    logLevel: logLevel.INFO,
    brokers: BROKERS,
    clientId: CLIENT_ID,
})

consumers = []
producer = kafka.producer()
producer.connect().then(console.log, console.error)

subscribeToAll()
async function subscribeToAll () {
    const consumerGroup = 'websocket' // Add random suffix to make each instance unique??
    try {
	const consumer = kafka.consumer({ groupId: consumerGroup})
	await consumer.connect()
	consumers.push(consumer)
	await consumer.subscribe({ topics: [/pets.*/, /adoptions.*/], fromBeginning: false })
	await consumer.run({
	    eachMessage: async ({ topic, partition, message }) => {
		const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
		console.log(`- ${prefix} ${message.key}#${message.value}`)

                const log = JSON.parse(message.value)
                const { location } = log
                if(!location) {
                    console.error(`E - Missing location field - ${prefix}`)
                    return
                }
                    
                eachSocketInLocation(location, (socket) => {
                    socket.send(JSON.stringify({ topic, log }))
                })

	    },
	})
    } catch(e) {
	console.error(`[${consumerGroup}] ${e.message}`, e)   
    }
}


// ---------------------------------------------------------------
// Websocket server
const ws = new WebSocket.Server({
    host: '0.0.0.0',
    port: PORT,
}, (a) => {
  const address = ws._server.address()
  console.log('WebSocket listening at ', address.address, address.port, address.family)
});


ws.on('error', (e) => {
    console.error(e)
})

ws.on('connection', (socket) => {
    console.log('Connection recieved for Websocket')
    sockets.push(socket)

    socket.on('error', console.error)
    socket.on('message', (str) => {
	try {
	    let msg = JSON.parse(str)
            
            if(!msg.location) {
		socket.send(JSON.stringify({ok: false, reasons: ['Missing .location field in handshake']}))
		return 
            }
            const location = (msg.location+'').toLowerCase()
	    socketsForLocation[location] = socketsForLocation[location] || []
	    socketsForLocation[location].push(socket)
	    socket.send(JSON.stringify({ok: true, message: `Successfully subscribed to "${location}" changes`}))
	    
        } catch(e) {
            console.error(e)
            socket.close()
        }

    })

    socket.on('close', function() {
	sockets = sockets.filter(s => s !== socket);
    })

})

function eachSocketInLocation(location, cb) {
    const sockets = socketsForLocation[location.toLowerCase()] || []

    sockets.forEach(cb)
}
