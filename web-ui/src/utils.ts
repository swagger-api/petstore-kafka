export function arrayToObject(arr: object[], key: string = 'id') {
  let obj = {}
  for(let el of arr) {
    // @ts-ignore
    obj[el[key]] = el
  }
  return obj
}
