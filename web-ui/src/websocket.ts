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
    // @ts-ignore
    const that: any = this
    this.send(JSON.stringify({ location }))
    console.log("websocket this", that, args)
  })

  websocket.addEventListener('message', function(event: MessageEvent) {
    // @ts-ignore
    console.log('websocket.message')
    ee.emit('message', event)
  })

  // onOpen(() => {
  //   // Handshake
  //   if(websocket)
  //     websocket.send(JSON.stringify({ type: 'handshake.request', location }))
  // })

  return disconnect
}

export function onMessage(cb: (json: any, websocket: WebSocket) => void) {
  ee.addListener('message', function (msg: any) {
    try {
      if(websocket)
        cb(JSON.parse(msg.data), websocket)
    } catch(e) {
      console.error(e)
    }
  })
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

