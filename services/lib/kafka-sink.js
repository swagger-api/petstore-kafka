const { FlatDB } = require('../lib')
const path = require('path')

const defaultOnLog = ({log, sink, id}) => {
  if(!id)
    return
  return sink.db.dbPut(id, log)
}

module.exports = class KafkaSink {
  constructor({name, topics, onLog, kafka, makeIdFn, basePath=__dirname }) {
    this.kafka = kafka
    this.makeIdFn = makeIdFn || ((log) => log.id) // Default discriminator
    this.topics = topics
    this.onLog = onLog || defaultOnLog // Persist it by default
    this.name = name
    this.admin = kafka.admin()

    this.db = new FlatDB(path.resolve(basePath, `./${name}.db`))
    this.subscribe()
  }

  async processLog(consumer, { topic, partition, message })  {
    const log = JSON.parse(message.value.toString())
    const id = this.makeIdFn(log)
    await this.onLog({
      log,
      sink: this,
      id,
      topic, partition, message,
    })
    // Note: This will still an out-of-bound offset, which may not exist on next start up.
    // Ensure that fromBeginning = false, and try to seek to low water mark ourselves.
    this.db.dbPutMeta(`${topic}-partition-${partition}-offset`, message.offset + 1) 
  }

  async seek({ consumer }) {
    return Promise.all(this.topics.map(async (topic) => {
      const offset = this.db.dbGetMeta(`${topic}-partition-0-offset`)
      if(offset) {
        this.info(`Cache exists, using ${offset} for ${topic}.partition-0`)
        return consumer.seek({ topic, partition: 0, offset: +offset })
      } 
      this.info(`Cache does not exist for ${topic}.partition-0. Seeking to beginning...`)
      const partitions = await this.admin.fetchTopicOffsets(topic)
      const low = (partitions.find(p => p.partition === 0) || {low: 0}).low
      this.info(`Low is ${low}. Offsets for ${topic} are ${JSON.stringify(partitions)}`)
      return consumer.seek({ topic, partition: 0, offset: +low })
    }))
  }

  get(id, defaultValue={}) {
    const val = this.db.dbGet(id)
    return typeof val === 'undefined' ? defaultValue : val
  }

  info(msg='', extra) {
    console.log(`${this.name} - ${msg}`, extra)
  }

  error(msg='', extra) {
    console.error(`${this.name} - ${msg}`, extra)
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
          await this.processLog(consumer, { topic, partition, message })
        },
      }).then(() => this.info(`Consumer initialized`))
      this.info('Consumer run')
      await this.seek({ consumer })
    } catch(e) {
      this.error(`[${consumerGroup}] ${e.message}`, e)   
    }
  }
}
