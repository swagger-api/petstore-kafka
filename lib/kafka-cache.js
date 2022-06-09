const {dbOpen, dbPut, dbGet, dbPutMeta, dbGetMeta} = require('../lib').db

module.exports = class KafkaCache {
  constructor({name, topics, onCache, kafka, makeIdFn }) {
    this.kafka = kafka
    this.makeIdFn = makeIdFn || ((log) => log.id) // Default disciminator
    this.topics = topics
    this.onCache = onCache || ((oldLog, newLog) => newLog) // Default to last-write-wins
    this.name = name
    dbOpen(`./${name}.db`)
    this.subscribe()
  }

  async saveToCache(consumer, { topic, partition, message })  {
    const log = JSON.parse(message.value.toString())
    const id = this.makeIdFn(log)
    if(!id)
      return
    const resource = dbGet(id) || {}
    const toCache = this.onCache(resource, log, id, { topic, partition, message })
    dbPut(id, toCache)
    dbPutMeta(`${topic}-partition-0-offset`, message.offset+ 1) // Note: If no new logs are added when we start up again, this will result in an invalid offset.
  }

  seek({ consumer }) {
    return Promise.all(this.topics.map(topic => {
      const offset = dbGetMeta(`${topic}-partition-0-offset`)
      if(offset) {
        this.info(`Cache exists, using ${offset} for ${topic}.partition-0`)
        return consumer.seek({ topic, partition: 0, offset: +offset })
      } 
      this.info(`Cache does not exist for ${topic}.partition-0`)
    }))
  }

  get(id, defaultValue={}) {
    const val = dbGet(id)
    return typeof val === 'undefined' ? defaultValue : val
  }

  info(msg='') {
    console.log(`${this.name} - ${msg}`)
  }

  async subscribe() {
    const consumerGroup = `${this.name}` // Make it random??
    try {
      const consumer = this.kafka.consumer({ groupId: consumerGroup})
      await consumer.connect()
      await consumer.subscribe({ topics: this.topics, fromBeginning: false }) 
      consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
          process.stdout.write('.')
          const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
          await this.saveToCache(consumer, { topic, partition, message })
        },
      }).then(() => this.info(`Consumer initialized`))
      this.info('Consumer run')
      await this.seek({ consumer })
    } catch(e) {
      console.error(`[${consumerGroup}] ${e.message}`, e)   
    }
  }
}
