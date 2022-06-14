import create from 'zustand'
import { onMessage } from './websocket'
import {arrayToObject} from './utils'

interface AdoptionReason {
  petId: string;
  message: string;
}
interface Adoption {
  id: string;
  status: 'requested' | 'pending' | 'available' | 'denied' | 'approved';
  pets: string[];
  reasons?: AdoptionReason[];
}

const baseAdoption: Adoption = {
  id: '',
  status: 'requested',
  pets: [],
}

export class AdoptionsAPI {
  url: string = '';

  constructor(url: string) {
    this.url = url
  } 

  getAdoptions = async (location: string) => {
    return fetch(`${this.url}/adoptions?location=${location}`).then(res => res.json()).then((data) => {
      return data as Adoption[]
    })
  }

  changeStatus = async ({status, id}: {status: string; id: string }) => {
    return fetch(`${this.url}/adoptions/${id}`,{
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({status})
    })
  }

  requestAdoption = ({pets, location}: {pets: string[]; location: string;}) => {
    return fetch(`${this.url}/adoptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pets, location }),
    })
  }

}

const api = new AdoptionsAPI('/api')

const useStore = create<{
  adoptions: {
    [key: string]: Adoption
  };
  requestAdoptions({pets,location}: {pets: string[]; location: string;}): void;
  fetchAdoptions({location}: {location: string;}): void;
  changeStatus({status, id}: {id: string; status: string;}): void;
}>((set) => ({
  adoptions: {},
  fetchAdoptions: async ({ location }) => {
    try {
      const adoptions = await api.getAdoptions(location)
      set(() => ({ adoptions: arrayToObject(adoptions, 'id') }))
    } catch (e) {
      console.error(e)
      // TODO
    }
  },
  changeStatus: async ({ id, status }) => {
    try {
      const adoptions = await api.changeStatus({status, id})
    } catch (e) {
      console.error(e)
      // TODO
    }
  },
  requestAdoptions: async ({ pets, location }) => {
    try {
      await api.requestAdoption({pets, location})
    } catch (e) {
      console.error(e)
      // TODO
    }
  }
}))

// WebSocket connection
onMessage('adoptions.store', (json: any, websocket: WebSocket) => {
  if(json.type === 'kafka' && json.topic.startsWith('adoptions.')) {
    useStore.setState(state => {
      const adoption: Adoption = json.log
      const oldAdoption = state.adoptions[adoption.id] || {}
      const newAdoption = {...baseAdoption, ...oldAdoption, ...adoption}

      return {
        adoptions: {
          ...state.adoptions,
          [adoption.id]: newAdoption,
        }
      }
    })
  }
})


export default useStore
