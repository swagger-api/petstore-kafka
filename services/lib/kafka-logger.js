const { logLevel } = require('kafkajs')
module.exports = function KafkaLogger() {
  return ({ namespace, level, label, log }) => {
    const { message, groupId, timestamp, extra=[] } = log
    let msgs = extra.filter(Boolean).map(e => typeof e === 'string' ? e : JSON.stringify(e))
    module.exports.log({prefix: 'K', timestamp, level, msgs: [groupId, namespace, ...msgs, message]})
  }
}

module.exports.log = function log({level, prefix=' ', timestamp=new Date(), msgs=[]}) {
  let levelStr = typeof level === 'number' ? kafkaLevel(level) : level
  let msgStr = msgs.filter(a => a).join(' - ')
  consoleFn(level, `[${prefix}][${levelStr}] ${timestamp} - ${msgStr}`)
}

function consoleFn(level, ...args) {
  switch(level) {
  case logLevel.ERROR:
  case logLevel.NOTHING:
    return console.error(...args)
  case logLevel.WARN:
    return console.warn(...args)
  case logLevel.INFO:
    return console.info(...args)
  case logLevel.DEBUG:
    return console.debug(...args)
  }
}

function kafkaLevel(level) {
  switch(level) {
  case logLevel.ERROR:
  case logLevel.NOTHING:
    return 'ERROR'
  case logLevel.WARN:
    return 'WARN'
  case logLevel.INFO:
    return 'I'
  case logLevel.DEBUG:
    return 'D'
  }
}
