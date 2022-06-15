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
    this.admin = this.kafka.admin()
    this.consumer = this.kafka.consumer({ groupId: this.name })

    this.db = new FlatDB(path.resolve(basePath, `./${name}.db`))
    this.subscribe()
  }

  async processLog({ topic, partition, message })  {
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

  async seek() {
    return Promise.all(this.topics.map(async (topic) => {
      const offset = this.db.dbGetMeta(`${topic}-partition-0-offset`)
      if(offset) {
        this.info(`Cache exists, using ${offset} for ${topic}.partition-0`)
        return this.consumer.seek({ topic, partition: 0, offset: +offset })
      } 
      this.info(`Cache does not exist for ${topic}.partition-0. Seeking to beginning...`)
      const partitions = await this.admin.fetchTopicOffsets(topic)
      const low = (partitions.find(p => p.partition === 0) || {low: 0}).low
      this.info(`Low is ${low}. Offsets for ${topic} are ${JSON.stringify(partitions)}`)
      return this.consumer.seek({ topic, partition: 0, offset: +low })
    }))
  }

  get(id, defaultValue={}) {
    const val = this.db.dbGet(id)
    return typeof val === 'undefined' ? defaultValue : val
  }

  info(...msgs) {
    this.consumer.logger().info(null, {extra: [this.name, ...msgs]})
  }

  error(...msgs) {
    this.consumer.logger().error(null, {extra: [this.name, ...msgs]})
  }

  async subscribe() {
    try {
      await this.consumer.connect()
      await this.consumer.subscribe({ topics: this.topics, fromBeginning: false }) 
      this.consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
          await this.processLog({ topic, partition, message })
        },
      }).then(() => this.info(`Consumer initialized`))
      await this.seek()
    } catch(e) {
      this.error(`${e.message}`, e)   
    }
  }
}
