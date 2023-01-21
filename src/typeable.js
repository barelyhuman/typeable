import { promises as fs } from 'fs'
import { addToQueue } from './queue'
import { getValueType, isValidKey, walkObject } from './utils'
import { createCodeWriter } from './writer'

/**
 * @type {Options}
 */
const defaultOptions = {
  outfile: 'typeable.d.ts',
  rootInterfaceName: 'TypeableInterface',
}

/**
 *
 * @param {Options} options
 * @returns
 */
export function createTypeable(baseObject, options) {
  options = Object.assign(defaultOptions, options)
  const sourceFile = createCodeWriter()

  const rootInterface = sourceFile.addInterface({
    name: options.rootInterfaceName,
    isExported: true,
  })

  const proxyHandler = {
    set(obj, prop, value) {
      // add to queue
      addToQueue(() => {
        return contructTypeTree({
          baseObject,
          rootInterface,
          sourceFile,
          outfile: options.outfile,
        })
      })

      return shouldCreateSubProxy(value)
        ? Reflect.set(obj, prop, new Proxy(value, proxyHandler))
        : Reflect.set(...arguments)
    },
  }

  addToQueue(() => syncFile({ outfile: options.outfile, sourceFile }))

  return new Proxy(baseObject, proxyHandler)
}

async function contructTypeTree({
  baseObject,
  rootInterface,
  sourceFile,
  outfile,
}) {
  walkObject(baseObject, function (key, value, path) {
    if (!isValidKey(key)) {
      return
    }

    const propKey = key
    const parentIntName = path.join('_')
    let parentInterface =
      path.length == 0
        ? rootInterface
        : sourceFile.getInterface(parentIntName) ||
          sourceFile.addInterface({
            name: parentIntName,
          })

    let propType = getValueType(value)

    if (!propType) {
      const intName = path.concat(key).join('_')
      propType = intName

      !sourceFile.getInterface(intName) &&
        sourceFile.addInterface({
          name: intName,
        })
    }

    !parentInterface.getProperty(propKey) &&
      parentInterface.addProperty({
        name: propKey,
        type: propType,
      })
  })
  await syncFile({
    outfile: outfile,
    sourceFile,
  })
}

async function syncFile({ outfile, sourceFile }) {
  await fs.writeFile(outfile, sourceFile.print(), 'utf8')
}

const shouldCreateSubProxy = value =>
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !(value instanceof Set) &&
  !(value instanceof Map)
