import create from 'zustand'

const READYSTATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}

interface Pet {
  id: string;
  name: string;
  location?: string;
  status: 'available' | 'onhold' | 'adopted';
}

export class PetsAPI {
  url: string = '';

  constructor(url: string) {
    this.url = url
  } 

  getPets = async (location: string) => {
    return fetch(`${this.url}/pets?location=${location}`).then(res => res.json()).then((data) => {
      return data as Pet[]
    })
  }

  addPet = ({name, location}: {name: string; location: string;}) => {
    return fetch(`${this.url}/pets`, {
      method: 'POST',
      headers: {
	'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, location }),
    })
  }
}

const api = new PetsAPI('/api')

const useStore = create<{
  websocketError?: string;
  petError?: string;
  location: string;
  websocket: WebSocket | null;
  pets: {
    [key:string]: Pet
  };
  addPet(newPet: {name: string}): void;
  fetchPets(): void;
  connect({ location, websocketUrl }: {location: string; websocketUrl: string}): () => void;
  disconnect(): void;
}>((set, get) => ({
  location: '',
  websocket: null,
  pets: {},
  disconnect: () => {},
  connect: ({ location, websocketUrl }) => {
    console.log("Connecting to WebSocket with location = " + location)
    let {disconnect, websocket } = get()
    set({ websocketError: '' })
    disconnect()

    websocket = new WebSocket(websocketUrl)

    websocket.addEventListener('open', () => {
      console.log('Connected to WebsocketAPI')
      if(!websocket || websocket.readyState !== READYSTATE.OPEN)
        return
      websocket.send(JSON.stringify({
        location
      }))
    })

    websocket.addEventListener('message', (msg) => {
      try {
        console.log('Received WebsocketAPI message: ' + msg.data)
        const json: any = JSON.parse(msg.data)
        if (json.topic === 'pets.added') {
          set(state => {
            return {
              pets: { ...state.pets, [json.log.id]: json.log }
            }
          })
        }

        if (json.topic === 'pets.statusChanged') {
          set(state => {
            return {
              pets: { ...state.pets, [json.log.id]: json.log }
            }
          })
        }
      } catch (e) {
        set({ websocketError: e + '' })
      }
    })

    websocket.addEventListener('error', (event) => {
      if(!websocket)
        return
      console.log('WebsocketAPI Error')
      console.error(event)
      set({ websocketError: event + '' })
    })

    const wrappedDisconnect = () => {
      if(websocket)
        websocket.close()
      set({ disconnect: () => {} })
    }

    set({ disconnect: wrappedDisconnect, location, websocket })
    return wrappedDisconnect
  },
  addPet: async ({ name }) => {
    const { location } = get()
    try {
      await api.addPet({ name, location })
      set(() => ({ petError: '' }))
    } catch(e) {
      set(() => ({ petError: e+'' }))
    }
  },
  fetchPets: async () => {
    try {
      const pets = await api.getPets(get().location)
      set(() => ({ petError: '', pets: arrayToObject(pets, 'id') }))
    } catch (e) {
      set(() => ({ petError: e+'' }))
    }
  }
}))

export default useStore

function arrayToObject(arr: object[], key: string = 'id') {
  let obj = {}
  for(let el of arr) {
    // @ts-ignore
    obj[el[key]] = el
  }
  return obj
}
