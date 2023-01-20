import { promises as fs } from 'fs'
import { CodeWriter } from './writer'

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
    return setTimeout(() => {
      processQueue()
    }, 100)
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
    this.sourceFile = new CodeWriter()

    this.sourceFile.addInterface({
      name: this.options.rootInterfaceName,
      isExported: true,
    })
  }

  proxyHandler() {
    const self = this
    return {
      set(obj, prop, value) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          Reflect.set(obj, prop, new Proxy(value, self.proxyHandler()))
        } else {
          Reflect.set(...arguments)
        }

        // add to queue
        addToQueue(() => {
          return self.contructTypeTree()
        })

        return true
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
      let parentInterface = sourceFile.getInterface(path.join('_'))

      if (!parentInterface) {
        if (path.length == 0) {
          parentInterface = rootInterface
        } else {
          parentInterface = sourceFile.addInterface({
            name: path.join('_'),
          })
        }
      }

      if (typeof value == 'object') {
        const intName = path.concat(key).join('_')
        let int = sourceFile.getInterface(intName)
        if (!int) {
          int = sourceFile.addInterface({
            name: intName,
          })
        }

        !parentInterface.getProperty(propKey) &&
          parentInterface.addProperty({
            name: propKey,
            type: intName,
          })
      } else {
        !parentInterface.getProperty(propKey) &&
          parentInterface.addProperty({
            name: propKey,
            type:
              typeof value === 'function'
                ? '(...args:any[])=>any'
                : typeof value,
          })
      }
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

function walkObject(obj, handler, path = []) {
  return Object.keys(obj).forEach(key => {
    if (typeof obj[key] == 'object') {
      walkObject(obj[key], handler, path.concat(key))
    }
    handler(key, obj[key], path)
  })
}

const isValidKey = str => !/[ \-]/g.test(str)
