
let queries = new URLSearchParams(window.location.search);

export const setQuery = (key: string, value: string) => {
  if (value.trim() !== '') {
    queries.set(key, value+'')
    const { protocol, pathname, host } = window.location;
    const newUrl = `${protocol}//${host}${pathname}?${queries.toString()}`
    window.location.assign(newUrl)
  }
}

export const getQuery = (key: string) => {
  let value = queries.get(key) || ''
  return value.trim()
}
