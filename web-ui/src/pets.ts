import create from 'zustand'
import uuid from 'uuid'


interface Pet {
  name: string;
  status: 'available' | 'onhold' | 'adopted';
}

interface State {
  pets: {
    [id: string]: Pet;
  }
}

const useStore = create<State>(set => ({
  pets: {},
  addPet: (newPet: {name: string}) => set(state => {
    const id = uuid.v4()
    const pet: Pet = {
      name: newPet.name,
      status: 'available',
    }
    state.pets[id] = pet
    return state
  }),
}))
