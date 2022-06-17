/// <reference types="jest" />
const { queryFilter, matchesQuery, queryStrToMatchQuery, queryObjToMatchQuery } = require('./db')

describe('queries', () => {

   describe('queryObjToMatchQuery', () => {

     it('should convert object to $eqi', async () => {
       expect(queryObjToMatchQuery({
         one: 'a',
         two: 'b',
       })).toEqual({
         one: {$eqi: 'a'},
         two: {$eqi: 'b'},
       })
     })

     it('should convert arrays into $and', async () => {
       expect(queryObjToMatchQuery({
         one: 'a',
         two: ['b', 'c']
       })).toEqual({
         one: {$eqi: 'a'},
         two: {$and: [{$eqi: 'b'}, {$eqi: 'c'}]},
       })
     })


     it('should not include undefined values', async () => {
       expect(queryObjToMatchQuery({
         one: 'a',
         two: undefined,
       })).toEqual({
         one: {$eqi: 'a'},
       })
     })

   })

  describe('queryStrToMatchQuery', () => {


    it('should convert to $eqi', async () => {
      expect(
        queryStrToMatchQuery('test')
      ).toEqual({$eqi: 'test'})

    })

    it('should convert bang to $not', async () => {
      expect(
        queryStrToMatchQuery('!test')
      ).toEqual({
        $not: {$eqi: 'test'}
      })

    })

    it('should convert & into $and', async () => {
      expect(
        queryStrToMatchQuery('test&!foo')
      ).toEqual({
        $and: [{$eqi: 'test'}, {$not: {$eqi: 'foo'}}]
      })
    })


  })


  describe('queryFilter', () => {

    it('should filter values with scalars', async () => {
      // Given
      const values = [
        {key:  1,},
        {key: 'a'},
        {key: null},
        {key: 0},
        {key: false},
      ]
      
      // When/Then
      expect(queryFilter(values, {key: 1})).toEqual([ {key: 1} ])
      expect(queryFilter(values, {key: 'a'})).toEqual([ {key: 'a'} ])
      expect(queryFilter(values, {key: null})).toEqual([ {key: null} ])
      expect(queryFilter(values, {key: 0})).toEqual([ {key: 0} ])
      expect(queryFilter(values, {key: false})).toEqual([ {key: false} ])
    })


    it('should filter all values matching scalar', async () => {
      // Given
      const values = [
        {key: 'num', value: 1},
        {key: 'num', value: 2},
        {key: 'num', value: 3},
        {key: 'str', value: 'a'},
        {key: 'str', value: 'b'},
      ]
      
      // When
      const res = queryFilter(values, {key: 'num'})

      // Then
      expect(res).toHaveLength(3)
      expect(res[1]).toEqual({key: 'num', value: 2})
    })


    it('should always return an array', async () => {
      // Given
      const values = [
        {key: 'num', value: 1},
        {key: 'num', value: 2},
        {key: 'num', value: 3},
        {key: 'str', value: 'a'},
        {key: 'str', value: 'b'},
      ]
      
      // When

      // Then
      expect(queryFilter(values, {key: 'missing'})).toEqual([])
      expect(queryFilter('', {key: 'missing'})).toEqual([])
    })


    it('multiple fields should act as logical AND', async () => {
      // Given
      const values = [
        {name: 'fido', age: 3},
        {name: 'fido', age: 3},
        {name: 'fido', age: 4},
        {name: 'rex', age: 3},
      ]
      
      // When

      // Then
      expect(queryFilter(values, {name: 'fido', age: 3})).toEqual([{name: 'fido', age: 3}, {name: 'fido', age: 3}])
    })
    

  })

  describe('matchesQuery', () => {


    it('empty query returns true', async () => {

      expect(matchesQuery({
        one: '1'
      }, {})).toEqual(true)
    })

	  it('should support scalars', async () => {
      expect(matchesQuery('foo', 'foo')).toBe(true)
      expect(matchesQuery('foo', 'bar')).toBe(false)
    })


	  it('should support fields + scalars', async () => {
      expect(matchesQuery({key: 'a'}, {key: 'a'})).toEqual(true)
    })

    describe('$eq', () => {

	    it('should match values including type', async () => {
	      // Given
        const source = {
          key: '1'
        }
	      
	      // When
        expect(matchesQuery({
          key: '1'
        }, {
          key: {$eq: '1'}
        })).toEqual(true)


        expect(matchesQuery({
          key: '1'
        }, {
          key: {$eq: 1}
        })).toEqual(false)
      })


	    it('should reject if test exists but field does not', async () => {
	      // When
        expect(matchesQuery({
          one: '1'
        }, {
          two: '2'
        })).toEqual(false)

      })

	    it('should match strings with case sensitivity', async () => {

        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: {$eq: 'Foo'}
        })).toEqual(true)

        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: {$eq: 'foo'}
        })).toEqual(false)

      })

    })

    describe('$not', () => {

	    it('should invert the matches', async () => {
	      // Given
        const source = {
          key: '1'
        }
	      
	      // When
        expect(matchesQuery({
          key: '1'
        }, {
          key: { $not: 'foo' }
        })).toEqual(true)

        expect(matchesQuery({
          key: '1'
        }, {
          key: { $not: '1' }
        })).toEqual(false)
      })

    })

    describe('$eqi', () => {

	    it('should match strings case-insensitive', async () => {

        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: { $eqi: 'foo' }
        })).toEqual(true)

      })

    })

    describe('$or', () => {
      
      it('should throw if not an array', async () => {

        expect(() => {
          matchesQuery({key: 'one'}, {one: {$or: null}})
        }).toThrowError('$or must be an array of queries')

      })

      it('should match if at least one clause returns true', async () => {

        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: { $or: ['foo', 'Foo'] }
        })).toEqual(true)

        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: { $or: ['foo', 'Boo'] }
        })).toEqual(false)

      })

    })

    describe('$and', () => {

      it('should throw if not an array', async () => {

        expect(() => {
          matchesQuery({key: 'one'}, {one: {$and: null}})
        }).toThrowError('$and must be an array of queries')

      })

      it('should return true if-and-only-if all clauses match', async () => {

        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: { $and: [{$eqi: 'fOo'}, {$eqi: 'fOO'}] }
        })).toEqual(true)

        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: { $and: [{$eqi: 'fOo'}, {$eqi: 'baz'}] }
        })).toEqual(false)

      })

    })

    describe('all', () => {

      it('should use logical AND for multiple query fields', async () => {

        // All agree
        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: { $eqi: 'foo', $eq: 'Foo', $not: 'bar' }
        })).toEqual(true)

        // With $eqi boo
        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: { $eqi: 'boo', $eq: 'Foo', $not: 'bar' }
        })).toEqual(false)

        // With $eq boo
        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: { $eqi: 'foo', $eq: 'boo', $not: 'bar' }
        })).toEqual(false)

        // With $not Foo
        expect(matchesQuery({
          key: 'Foo'
        }, {
          key: { $eqi: 'foo', $eq: 'Foo', $not: 'Foo' }
        })).toEqual(false)

      })


    })

    describe('child fields', () => {

      it('should test nested objects', async () => {
        expect(matchesQuery({
          one: {
            foo: 'bar',
            bar: 'baz'
          }
        }, {
          one: {
            foo: 'bar'
          }
        })).toBeTruthy()

        expect(matchesQuery({
          one: {
            foo: 'bar',
            bar: 'baz'
          }
        }, {
          one: {
            foo: 'nope'
          }
        })).toBeFalsy()

      })

      it('should test deeply nested objects', async () => {
        expect(matchesQuery({
          one: {
            two: {
              three: {
                four: '4'
              }
            }
          }
        }, {
          one: {
            two: {
              three: {
                four: {$eq: '4'}
              }
            }
          }
        })).toBeTruthy()

        expect(matchesQuery({
          one: {
            two: {
              three: {
                four: '4'
              }
            }
          }
        }, {
          one: {
            two: {
              three: {
                four: {$eq: 'nope'}
              }
            }
          }
        })).toBeFalsy()

      })

      it('should allow testing keys with a dollar ', async () => {
        expect(matchesQuery({
          $test: 'ok'
        }, {
          $$test: 'ok'
        })).toBeTruthy()


        expect(matchesQuery({
          $test: 'ok'
        }, {
          $$test: 'nope'
        })).toBeFalsy()

      })


    })


  })

})
