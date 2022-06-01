
export const setQuery = (key: string, value: string) => {
  if (typeof window !== 'undefined' && value.trim() !== '') {
    let query = new URLSearchParams(window.location.search);
    query.set(key, value+'')
    const { protocol, pathname, host } = window.location;
    const newUrl = `${protocol}//${host}${pathname}?${query.toString()}`
    window.location.assign(newUrl)
    // window.history.pushState({}, '', newUrl);
  }
}

export const getQuery = (key: string) => {
  if (typeof window !== 'undefined') {
    let queries  = new URLSearchParams(window.location.search);
    let value = queries.get(key) || ''
    return value
  }
  return ''
}
