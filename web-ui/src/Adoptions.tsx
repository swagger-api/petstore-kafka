import { useEffect, useMemo } from 'react'
import useAdoptionsStore from './adoptions.store'
import usePetsStore from './pets.store'
import { Button } from './UI'
import { Pill } from './UI'
import { getQuery } from './query'

export default function Adoptions() {
  const location = getQuery('location')

  const adoptions = Object.values(useAdoptionsStore(s => s.adoptions))
  adoptions.reverse()
  const fetchAdoptions = useAdoptionsStore(s => s.fetchAdoptions)

  useEffect(() => {
    fetchAdoptions({ location })
  }, [location])

  // Use local cache of pets to replace names.
  const pets = usePetsStore(s => s.pets)

  return (
    <div className="max-h-[600px] overflow-y-scroll" >
      {adoptions.map(a => (
        <div key={a.id} className="mt-2 border-gray-400 border p-4 rounded-md" >
          <h2>
            Adoption: <span className="font-monospace text-gray-600" > #{a.id} </span>
          </h2>
          Status: <Pill color="orange">{a.status}</Pill>

          <div className="py-3 space-y-1" >
            {a.pets.map(id => (
              <div key={id} className="border-gray-400 text-gray-600 border rounded-md ml-1 p-1.5 font-bold" > {(pets[id] || {}).name} </div>
            ))}
          </div>
          {a.reasons?.length ? (
            <div className="bg-red-50 border-red-600 border text-red-600 p-3 mt-4" >
              {a.reasons.map(reason => (
                <div> {reason} </div>
              ))}
            </div>
          ) : null}
          <div className='flex justify-end mt-2'>
            <Button color='green'> Approve </Button>
            <Button className="ml-2" color='red'> Deny </Button>
          </div>
        </div>

      ))}

    </div>
  )
}
