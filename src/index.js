import { promises as fs } from 'fs'
import { createCodeWriter } from './writer'
import { walkObject, isValidKey, getValueType } from './utils'

/**
 * @typedef {object} Options
 * @property {string} outfile
 * @property {string} rootInterfaceName
 */

const q = []
let queueRunning = false

function addToQueue(fn) {
  q.push(fn)
  processQueue()
}

async function processQueue() {
  if (queueRunning) {
    setTimeout(() => {
      processQueue()
    }, 100)
    return
  }
  queueRunning = true
  await q.reduce((acc, item) => {
    return acc.then(_ => item())
  }, Promise.resolve())
  queueRunning = false
}

class Typeable {
  baseObject = {}

  /**
   * @type {Options}
   */
  options = {
    outfile: 'typeable.d.ts',
    rootInterfaceName: 'TypeableObject',
  }

  /**
   * @type {CodeWriter}
   */
  sourceFile

  /**
   *
   * @param {*} baseObject
   * @param {Options} options
   */
  constructor(baseObject, options) {
    this.baseObject = baseObject
    Object.assign(this.options, options)
    this.setupSource()
    addToQueue(() => {
      return this.syncFile()
    })
  }

  setupSource() {
    this.sourceFile = createCodeWriter()

    this.sourceFile.addInterface({
      name: this.options.rootInterfaceName,
      isExported: true,
    })
  }

  proxyHandler() {
    const self = this

    const shouldCreateSubProxy = value =>
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Set) &&
      !(value instanceof Map)

    return {
      set(obj, prop, value) {
        // add to queue
        addToQueue(() => {
          return self.contructTypeTree()
        })

        return shouldCreateSubProxy(value)
          ? Reflect.set(obj, prop, new Proxy(value, self.proxyHandler()))
          : Reflect.set(...arguments)
      },
    }
  }

  async contructTypeTree() {
    const rootInterface = this.sourceFile.getInterface(
      this.options.rootInterfaceName
    )

    const sourceFile = this.sourceFile

    walkObject(this.baseObject, function (key, value, path) {
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

    await this.syncFile()
  }

  async syncFile() {
    await fs.writeFile(this.options.outfile, this.sourceFile.print(), 'utf8')
  }

  get mutable() {
    return new Proxy(this.baseObject, this.proxyHandler())
  }
}

/**
 * @param {object} obj
 * @param {Options} options
 * @returns
 */
export const createTypeable = function (obj, options) {
  return new Typeable(obj, options).mutable
}
