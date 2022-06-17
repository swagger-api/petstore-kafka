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
  dbQuery(query) {
    return queryFilter(this.dbGetAll(), query)
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
module.exports.queryFilter = queryFilter
module.exports.matchesQuery = matchesQuery
module.exports.queryStrToMatchQuery = queryStrToMatchQuery
module.exports.queryObjToMatchQuery = queryObjToMatchQuery

// -------------------------------------------
// Utilities

function queryFilter(values, query) {
  if(!Array.isArray(values)) {
    return []
  }
  return values.filter((value) => matchesQuery(value, query, {}))
}

function queryStrToMatchQuery(str) {
  if(typeof str === 'undefined')
    return undefined
  str = str+''

  if(str.includes('|'))
    return {$or: str.split('|').map(queryStrToMatchQuery)}

  if(str.includes('&'))
    return {$and: str.split('&').map(queryStrToMatchQuery)}

  if(str.startsWith('!')) {
    return {$not: queryStrToMatchQuery(str.replace('!', ''))}
  }

  return {$eqi: str}
}

// !test = {$not: test}
// [one,two] = {$and: [one,two]}
function queryObjToMatchQuery(obj) {
  let query = {}
  for(field in obj) {
    let value = obj[field]
    if(Array.isArray(value)) {
      value = {$and: value.map(v => queryStrToMatchQuery(v))}
    } else {
      value = queryStrToMatchQuery(value)
    }
    query[field] = value
  }
  return query
}

// query = scalar | {[testField]: query, ...queryObject}
// queryObject = {$eq: scalar, $not: queryObject, $or: queryObj[], $and: queryObj[]}
// ie: a testField is any key that is not part of the predefined query list. To test a field that has a dollar in it, you'll need to escape it with double dollar. Eg: $$eq will be the testField $eq

const specialKeys = new Set(['$eq', '$eqi', '$or', '$and', '$not'])
function matchesQuery(testValue, query) {

  // Canonicalize the query
  if(!isObj(query)) {
    query = {$eq: query}
  } 

  // $eq
  if(typeof query.$eq !== 'undefined') {
    let scalarValue = query.$eq

    if(typeof testValue !== typeof scalarValue)
      return false

    if(!Object.is(testValue, scalarValue)) {
      return false
    }
  }

  if(typeof query.$eqi !== 'undefined') {
    let scalarValue = query.$eqi

    if(typeof testValue !== typeof scalarValue) {
      return false
    }

    if(typeof scalarValue === 'string') {
      if(testValue.toLowerCase() !== scalarValue.toLowerCase()) {
        return false
      }
    } else if(!Object.is(testValue, scalarValue)) {
      return false
    }

  }

  if(typeof query.$not !== 'undefined') {
    let childQuery = query.$not
    if(matchesQuery(testValue, childQuery))
      return false
  }


  if(typeof query.$or !== 'undefined') {
    let clauses = query.$or
    if(!Array.isArray(clauses)) {
      throw new Error('$or must be an array of queries')
    }

    if(!clauses.some(q => matchesQuery(testValue, q))) {
      return false
    }
  }

  if(typeof query.$and !== 'undefined') {
    let clauses = query.$and
    if(!Array.isArray(clauses)) {
      throw new Error('$and must be an array of queries')
    }

    if(clauses.some(q => !matchesQuery(testValue, q))) {
      return false
    }
  }

  // Try other fields
  let testFields = Object
      .keys(query)
      .filter(f => !specialKeys.has(f))
      .map(field => {
        if(field.startsWith('$$')) {
          return field.replace('$$', '$') // Will only replace the first match.
        } 
        return field
      })

  // It has to be an object for this to work.
  if(testFields.length && !isObj(testValue))
    return false

  if(testFields.some(field => {
    let queryField = field.startsWith('$') ? '$' + field : field
    return !matchesQuery(testValue[field], query[queryField])
  })) {
    return false
  }

  return true
}

function isObj(test) {
  return test && typeof test === 'object'
}

function omit(obj, keys) {
  let newObj = {...obj}
  keys.forEach(key => {
    delete newObj[key]
  })
  return newObj
}
