// Kafka will manage the offsets and commiting them.
// This is useful for handlers that want to produce messages as a result of consuming some.
// We don't want to manage the offsets ourselves in that case because the source of truth is the Topic
// not the local disk. 
const defaultOnLog = module.exports = class KafkaStream {

  constructor({name, topics, onLog, kafka }) {
    this.kafka = kafka
    this.topics = topics
    this.onLog = onLog || (() => {})
    this.name = name
    this.consumer = this.kafka.consumer({ groupId: this.name })
    this.subscribe()
  }

  async processLog({ topic, partition, message })  {
    const log = JSON.parse(message.value.toString())
    await this.onLog({
      log,
      topic, partition, message,
    })
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
        autoCommit: true, // We are going to leave Kafka to manage offsets
        eachMessage: async ({ topic, partition, message }) => {
          await this.processLog({ topic, partition, message })
        },
      }).then(() => this.info(`Consumer initialized`))
    } catch(e) {
      this.error(`${e.message}`, ['Retrying', e.stack])   
      setTimeout(() => this.subscribe(), 1500) // retry
    }
  }
}
