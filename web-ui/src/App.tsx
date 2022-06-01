import {useState} from 'react';
import Pets from './Pets'
import Adoptions from './Adoptions'
import useAdoptionsStore from './adoptions.store'
import usePetsStore from './pets.store'
import { Button } from './UI'

function App() {
    const [location, setLocation] = useState('Plett')
    const adoptions = Object.values(useAdoptionsStore(s => s.adoptions))
    const pets = Object.values(usePetsStore(s => s.pets))

    return (
	<div className="container mx-auto">

	  <div className="p-8 flex items-center" >
	    <h2>Location</h2>
	    <div className="flex" >

	    <input className="ml-2 px-2.5 py-1 border rounded-md" value={location} onChange={(e:any) => {setLocation(e.target.value)}} type="text" />
	    <Button className="ml-2" color='blue'> Change location</Button> 
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
