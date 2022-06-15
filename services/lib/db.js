const FlatFile = require('flat-file-db')
const path = require('path')

class FlatDb {
  constructor(file) {
    this.db = FlatFile.sync(file)
    this.db.on('open', () => this.log(`${file} opened`))
  }

  log(...msgs) {
    console.log(`[DB][I] ${new Date()} - ${msgs.join(' - ')}`)
  }

  dbPut(key, value) {
    // console.log(`DB: Saving ${key} with ${JSON.stringify(value)}`)
    return this.db.put(key, value)  
  } 

  // All keys, except the _meta key.
  dbGetAll(withMeta=false) {
    let keys = this.db.keys()
    keys = withMeta ? keys : keys.filter(a => a !== '_meta') 
    return keys.map(key => this.db.get(key))  
  } 

  dbGet(key) {
    return this.db.get(key)
  } 

  // {location: 'plett'} will filter all objects that have obj.location === 'plett'
  dbQuery(query, { caseInsensitive } = {} ) {
    return this.dbGetAll().filter(value => hasValues(value, query, { caseInsensitive }))
  } 

  // Update / Merge
  dbMerge(key, newValues) {
    const ori = this.dbGet(key) || {}

    if(typeof ori !== 'object' || !ori || typeof newValues !== 'object' || !newValues) {
      throw new Error('Tried to merge value(s) that are not objects')
    }

    return this.dbPut(key, {...ori, ...newValues})
  } 

  // Meta to keep it outside of other commands
  dbGetMeta (key) {
    let _meta = this.db.get('_meta') || {}

    // Heal from non-object value stored
    _meta = typeof _meta === 'object' && _meta ? _meta : {}
    return key ? _meta[key] : _meta
  } 

  dbPutMeta (key, value) {
    let _meta = this.dbGetMeta() || {}
    if(key) {
      _meta[key] = value
    } else {
      _meta = value
    }
    return this.db.put('_meta', _meta)
  } 

}

module.exports = FlatDb


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
