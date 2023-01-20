const { keys } = Object

export const walkObject = (obj, handler, path = []) => {
  return keys(obj).forEach(key => {
    if (typeof obj[key] == 'object') {
      walkObject(obj[key], handler, path.concat(key))
    }
    handler(key, obj[key], path)
  })
}

export const isValidKey = str => !/[ \-]/g.test(str)

export const getValueType = value => {
  let type = false
  const isFunction = typeof value === 'function'
  const isMapSet = value instanceof Map || value instanceof Set
  const isObj = typeof value == 'object'

  if (isFunction) type = '(...args: any[]) => any'
  else if (isMapSet) type = value instanceof Map ? 'Map<any,any>' : 'Set<any>'
  else if (isObj)
    if (keys(value).length === 0) type = 'Record<string,any>'
    // end check, need a interface for this
    else return false

  return type || typeof type
}
