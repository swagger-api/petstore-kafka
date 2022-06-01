import create from 'zustand'
import {v4 as uuidV4} from 'uuid'
import { useQuery, useMutation, useQueryClient } from 'react-query'


interface Pet {
  id: string;
  name: string;
  location?: string;
  status: 'available' | 'onhold' | 'adopted';
}

export function usePets(location: string) {
  return useQuery(['pets', location], () =>
      fetch(`/api/pets?location=${location}`).then(res => res.json()).then((data) => {
            return data as Pet[]
        })
    )
}

export function usePetAdder() {
  const queryClient = useQueryClient()
  return useMutation(({ name, location }: { name: string; location: string; }) => {
    return fetch('/api/pets', {
      method: 'POST',
      headers: {
	'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, location }),
    })
    
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('pets')
    }
  })
}


const useStore = create<{
  pets: {
    [key: string]: Pet
  };
  addPet(newPet: {name: string, location: string}): void;
}>(set => ({
  pets: {},
  addPet: (newPet) => set(state => {
    const id = uuidV4()
    const pet: Pet = {
      id,
      name: newPet.name,
      location: newPet.location,
      status: 'available',
    }
    return {
      pets: {...state.pets, [id]: pet }
    }
  }),
}))

export default useStore
