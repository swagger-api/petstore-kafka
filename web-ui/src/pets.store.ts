import create from 'zustand'
import { onMessage } from './websocket'
import {arrayToObject} from './utils'

interface Pet {
  id: string;
  name: string;
  location?: string;
  status: 'pending' | 'available' | 'onhold' | 'adopted';
}

function newPet(pet: Partial<Pet>): Pet {
  return Object.assign({
    id: '',
    name: '',
    status: 'pending'
  }, pet)
}

export class PetsAPI {
  url: string = '';

  constructor(url: string) {
    this.url = url
  } 

  getPets = async ({location,status}: {location?: string; status?: string;}) => {
    let queries = new URLSearchParams();
    if(location)
      queries.set('location', location)
    if(status)
      queries.set('status', status)
    
    return fetch(`${this.url}/pets?${queries}`).then(res => res.json()).then((data) => {
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
  fetchPets({location, status}: {location: string; status: string;}): void;
}>((set) => ({
  pets: {},
  addPet: async ({ name, location }) => {
    try {
      await api.addPet({ name, location })
      set(() => ({ petError: '' }))
    } catch(e) {
      set(() => ({ petError: e+'' }))
    }
  },
  fetchPets: async ({location, status}) => {
    try {
      const pets = await api.getPets({location, status})
      set(() => ({ petError: '', pets: arrayToObject(pets, 'id') }))
    } catch (e) {
      set(() => ({ petError: e+'' }))
    }
  }
}))

// WebSocket connection
onMessage('pets.store', (json: any) => {
  if(json.type === 'kafka' && json.topic.startsWith('pets.')) {
    const pet: Pet = json.log
    const id = pet.id
    useStore.setState(state => {
      const oldPet = (state.pets[id])
      return {
        pets: {
          ...state.pets,
          [id]: {...oldPet, ...pet}
        }
      }
    })
  }
})


export default useStore

