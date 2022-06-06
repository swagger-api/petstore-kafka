const FlatFile = require('flat-file-db')
const path = require('path')

let _db
module.exports.dbOpen = function(file) {
    _db = FlatFile.sync(path.resolve(__dirname, file))
    _db.on('open', () => console.log('DB: Opened connected'))
}

module.exports.dbPut = (key, value) => {
    console.log(`DB: Saving ${key} with ${JSON.stringify(value)}`)
    return _db.put(key, value)  
} 
module.exports.dbGetAll = (location) => {
    console.log(`DB: Fetching all records`)
    return _db.keys().map(key => _db.get(key))  
} 

module.exports.dbGet = (key) => {
    console.log(`DB: Fetching ${key}`)
    return _db.get(key)
} 

// {location: 'plett'} will filter all objects that have obj.location === 'plett'
module.exports.dbQuery = (query, { caseInsensitive } = {} ) => {
    console.log(`DB: Fetching all records for ${Object.keys(query)}`)
    return _db
        .keys()
        .map(key => _db.get(key))
        .filter(value => hasValues(value, query, { caseInsensitive }))
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
