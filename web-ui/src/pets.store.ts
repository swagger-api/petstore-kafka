import create from 'zustand'
import { onMessage } from './websocket'

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
  petError?: string;
  pets: {
    [key:string]: Pet
  };
  addPet(newPet: {name: string; location: string;}): void;
  fetchPets({location}: {location: string}): void;
}>((set, get) => ({
  pets: {},
  addPet: async ({ name, location }) => {
    try {
      await api.addPet({ name, location })
      set(() => ({ petError: '' }))
    } catch(e) {
      set(() => ({ petError: e+'' }))
    }
  },
  fetchPets: async ({location}: {location: string}) => {
    try {
      const pets = await api.getPets(location)
      set(() => ({ petError: '', pets: arrayToObject(pets, 'id') }))
    } catch (e) {
      set(() => ({ petError: e+'' }))
    }
  }
}))

// WebSocket connection
onMessage((json: any, websocket: WebSocket) => {
  if(json.type === 'kafka' && json.topic.startsWith('pets.')) {
    const pet: Pet = json.log
    useStore.setState(state => {
      return {
        pets: {...state.pets, [pet.id]: pet }
      }
    })
  }
})


export default useStore

function arrayToObject(arr: object[], key: string = 'id') {
  let obj = {}
  for(let el of arr) {
    // @ts-ignore
    obj[el[key]] = el
  }
  return obj
}
