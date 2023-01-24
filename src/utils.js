const { keys } = Object

export const GENERIC_MAP_DEF = 'Map<any,any>'
export const GENERIC_SET_DEF = 'Set<any>'
export const GENERIC_RECORD_DEF = 'Record<string,any>'

export const walkObject = (obj, handler, path = []) => {
  if (obj == null || obj == undefined) return
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

  if (isFunction) {
    type = getFunctionParamString(value)
  } else if (isMapSet) {
    type = value instanceof Map ? GENERIC_MAP_DEF : GENERIC_SET_DEF
  } else if (isObj) {
    if (value == null || value == undefined) {
      return value == null ? 'null' : 'undefined'
    }
    if (keys(value).length === 0) {
      type = GENERIC_RECORD_DEF
    }
    // end check, need a interface for this
    else return false
  }
  return type || typeof value
}

export const getFunctionParamString = func => {
  let str = '('
  for (let i = 0; i < func.length; i++) {
    if (func.length > 1 && i > 0) {
      str += ', '
    }
    str += `param${i}: any`
  }
  if (func.constructor.name === 'AsyncFunction') {
    str += ') => Promise<any>'
  } else {
    str += ') => any'
  }
  return str
}
