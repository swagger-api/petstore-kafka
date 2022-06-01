import create from 'zustand'
import {v4 as uuidV4} from 'uuid'
import { useQuery, useMutation, useQueryClient } from 'react-query'


interface Pet {
  id: string;
  name: string;
  status: 'available' | 'onhold' | 'adopted';
}

export function usePets() {
    return useQuery('pets', () =>
	fetch('/api/pets').then(res => res.json()).then((data) => {
            return data as Pet[]
        })
    )
}

export function usePetAdder() {
  const queryClient = useQueryClient()
  return useMutation((pet: Partial<Pet>) => {
    return fetch('/api/pets', {
      method: 'POST',
      headers: {
	'Content-Type': 'application/json'
      },
      body: JSON.stringify(pet),
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
  addPet(newPet: {name: string}): void;
}>(set => ({
  pets: {},
  addPet: (newPet) => set(state => {
    const id = uuidV4()
    const pet: Pet = {
      id,
      name: newPet.name,
      status: 'available',
    }
    return {
      pets: {...state.pets, [id]: pet }
    }
  }),
}))

export default useStore
