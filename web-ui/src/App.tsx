import {useState, useEffect} from 'react';
import Pets from './Pets'
import Adoptions from './Adoptions'
import useAdoptionsStore from './adoptions.store'
import { Button } from './UI'
import {setQuery, getQuery} from './query'
import WebsocketConsole from './WebsocketConsole'
import usePetsStore from './pets.store'
import {connect as wsConnect, onMessage } from './websocket'

const newTab = () => {
  window.open(window.location.href, '_blank')
}

function App() {
  const location = getQuery('location')
  const adoptions = Object.values(useAdoptionsStore(s => s.adoptions))
  const [locationInput, setLocationInput] = useState(location)
  const [websocketMsgCount, setWebsocketMsgCount] = useState(0)

  useEffect(() => {
    if (!location) {
      // Reloads the page
      setQuery('location', 'Plett')
      return 
    }

    onMessage('app', () => {
      setWebsocketMsgCount(s => s+1)
    })

    return wsConnect({
      location,
      url: 'ws://0.0.0.0:3300'
    })

  }, [])

  const pets = Object.values(usePetsStore(s => s.pets))

  return (
    <div className="container mx-auto">

      <div className="p-8 flex items-center" >
        <h2>Location</h2>
        <div className="flex" >

          <input id="location-input" className="ml-2 px-2.5 py-1 border rounded-md" value={locationInput} onChange={(e) => { setLocationInput(e.target.value) }} type="text" />
          <Button className="ml-2" color='blue' onClick={() => setQuery('location', locationInput)}> Change location</Button>
          <Button className="ml-2" color='blue' onClick={newTab}> Open in new Tab</Button>
        </div>
      </div>

      <div className="p-8" >
        <h2 className="text-2xl" > The game </h2>
        <p>
        WebSocket messages: {websocketMsgCount}
        </p>
        <p>
          {!pets.length ? (
            <span> No pets. Go rescue some pets!</span>
          ) : (
            <span> Pets in {location}: {pets.length}</span>
          )}
        </p>
        <p>
          {!adoptions.length ? (
            <span> No adoptions. Go get those pets adopted! </span>
          ) : (
            <span> Adoptions in {location}: {adoptions.length}</span>
          )}
        </p>
      </div>

      <div className="flex" >
        <div className="p-8 flex-1" >
          <h2 className="text-2xl ml-4">Pets in {location}</h2>
          <div className="mt-2" >
            <Pets />
          </div>
        </div>

        <div className="p-8 flex-1" >
          <h2 className="text-2xl ml-4">Adoptions in {location}</h2>
          <div className="mt-2" >
            <Adoptions />
          </div>
        </div>
      </div>

      <div>
      <WebsocketConsole location={location} />
      </div>

    </div>
  );
}

export default App;
