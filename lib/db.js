const FlatFile = require('flat-file-db')
const path = require('path')

let _db
module.exports = {
  dbOpen,
  dbPut,
  dbGetAll,
  dbGet,
  dbQuery,
  dbGetMeta,
  dbPutMeta,
}

function dbOpen(file) {
  _db = FlatFile.sync(file)
  _db.on('open', () => console.log('DB: Opened connected'))
}

function dbPut(key, value) {
  // console.log(`DB: Saving ${key} with ${JSON.stringify(value)}`)
  return _db.put(key, value)  
} 

// All keys, except the _meta key.
function dbGetAll(withMeta=false) {
  // console.log(`DB: Fetching all records ${withMeta ? 'including' : 'without' } the _meta key.`)
  let keys = _db.keys()
  keys = withMeta ? keys : keys.filter(a => a !== '_meta') 
  return keys.map(key => _db.get(key))  
} 

function dbGet(key) {
  // console.log(`DB: Fetching ${key}`)
  return _db.get(key)
} 

// {location: 'plett'} will filter all objects that have obj.location === 'plett'
function dbQuery(query, { caseInsensitive } = {} ) {
  // console.log(`DB: Fetching all records for ${Object.keys(query)}`)
  return dbGetAll().filter(value => hasValues(value, query, { caseInsensitive }))
} 

// Meta to keep it outside of other commands
function dbGetMeta (key) {
  // console.log(`DB: Fetching _meta${key ? '.' + key : ''}`)
  let _meta = _db.get('_meta') || {}

  // Heal from non-object value stored
  _meta = typeof _meta === 'object' && _meta ? _meta : {}
  return key ? _meta[key] : _meta
} 

function dbPutMeta (key, value) {
  // console.log(`DB: Updating _meta${key ? '.' + key : ''}`)
  let _meta = dbGetMeta() || {}
  if(key) {
    _meta[key] = value
  } else {
    _meta = value
  }
  return _db.put('_meta', _meta)
} 


// -------------------------------------------
// Utilities
function hasValues(large, small, { caseInsensitive=false }) {
  for(let key in small) {
    let left = large[key]
    let right = small[key]

    if(typeof small[key] === 'undefined')
      return true

    if(typeof left !== typeof right)
      return false

    if(caseInsensitive && typeof left === 'string') {
      return left.toLowerCase() === right.toLowerCase()
    }

    if(large[key] !== small[key]) {
      return false
    }
    
  }
  return true
}
