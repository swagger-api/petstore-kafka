import {useState, useEffect} from 'react';
import Pets from './Pets'
import Adoptions from './Adoptions'
import useAdoptionsStore from './adoptions.store'
import usePetsStore from './pets.store'
import { Button } from './UI'
import {setQuery, getQuery} from './query'

function App() {
  const adoptions = Object.values(useAdoptionsStore(s => s.adoptions))
  let location = getQuery('location')

  useEffect(() => {
    if(!location) {
      setQuery('location', 'Plett')
    }
  }, [location])

  const [locationInput, setLocationInput] = useState(location)
    const pets = Object.values(usePetsStore(s => s.pets))

    return (
	<div className="container mx-auto">

	  <div className="p-8 flex items-center" >
	    <h2>Location</h2>
	    <div className="flex" >

	    <input id="location-input" className="ml-2 px-2.5 py-1 border rounded-md" value={locationInput} onChange={(e) => { setLocationInput(e.target.value) }} type="text" />
	    <Button className="ml-2" color='blue' onClick={() => setQuery('location', locationInput)}> Change location</Button> 
	    <Button className="ml-2" color='blue'> Open in new Tab</Button> 
	    </div>
	  </div>

	  <div className="p-8" >
	    <h2 className="text-2xl" >Adoptions in {location}</h2>
	    <p>
	      { !pets.length ? <span> No pets. Go rescue some pets!</span> : null }
              { pets.length ? (<span> Pets: {pets.length}</span>) : null  }
	  </p>
	    <p>

	      { !adoptions.length && <span> No adoptions. Go get those pets adopted! </span>}
              { adoptions.length && (<span> Adoptions: {adoptions.length}</span>) }
	    </p>
	  </div>

	  <div className="flex" >
	    <div className="p-8 flex-1" >
	      <h2 className="text-2xl ml-4">Pets</h2>
	      <div className="mt-2" >
		<Pets />
	      </div>
	    </div>

	    <div className="p-8 flex-1" >
	      <Adoptions/>
            </div>
          </div>

        </div>
    );
}

export default App;
