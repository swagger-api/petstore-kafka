import EventEmitter from 'eventemitter3'

const CONNECTING = 0
const OPEN = 1
const CLOSING = 2
const CLOSED = 3

let websocket: WebSocket | null = null
let ee = new EventEmitter()

export function disconnect() {
  if(websocket) {
    console.log('Disconnecting websocket')
    if(websocket.readyState < CLOSING)
      websocket.close()
    websocket = null
  }
}

export function connect({ location, url }: { location: string; url: string}): () => void {
  disconnect()
  console.log("Connecting to WebSocket with location = " + location)

  websocket = new WebSocket(url)
  websocket.addEventListener('open', function(...args: any[]) {
    this.send(JSON.stringify({ type: 'handshake.request', location }))
  })

  websocket.addEventListener('message', function(event: MessageEvent) {
    ee.emit('message', event)
  })

  return disconnect
}

const idToListener: {
  [key: string]: (...args: any[]) => void;
} = {}
export function onMessage(id: string, cb: (json: any, websocket: WebSocket) => void) {
  if(idToListener[id]) {
    ee.removeListener('message', idToListener[id])
  }

  idToListener[id] = function (msg: any) {
    try {
      if(websocket)
        cb(JSON.parse(msg.data), websocket)
    } catch(e) {
      console.error(e)
    }
  }
  ee.addListener('message', idToListener[id])
}

export function onError(cb: (websocket: WebSocket) => void) {
  ee.addListener('error', function (msg: any) {
    try {
      console.error('Websocket Error: ' + msg)
      if(websocket)
        cb(websocket)
    } catch(e) {
      console.error(e)
    }
  })
}


export function onOpen(cb: (websocket: WebSocket) => void) {
  ee.addListener('open', function () {
    try {
      if(websocket)
        cb(websocket)
    } catch(e) {
      console.error(e)
    }
  })
}

