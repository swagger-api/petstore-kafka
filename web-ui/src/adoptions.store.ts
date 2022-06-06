import create from 'zustand'
import {v4 as uuidV4} from 'uuid'
import { useQuery, useMutation, useQueryClient } from 'react-query'


interface Adoption {
  id: string;
  status: 'requested' | 'pending' | 'denied' | 'approved';
  pets: string[];
}

export function useAdoptions() {
    return useQuery('adoptions', () =>
	fetch('/api/adoptions').then(res => res.json()).then((data) => {
            return data as Adoption[]
        })
    )
}




const useStore = create<{
  adoptions: {
    [key: string]: Adoption
  };
  addAdoption(pets: string[]): void;
}>(set => ({
  adoptions: {},
  addAdoption: (pets) => set(state => {
    const id = uuidV4()
    const adoption: Adoption = {
      id,
      status: 'requested',
      pets,
    }
    return {
      adoptions: {...state.adoptions, [id]: adoption }
    }
  }),
}))

export default useStore
