import { Project, ScriptTarget, SourceFile } from 'ts-morph'

/**
 * @typedef {object} Options
 * @property {string} outfile
 * @property {string} rootInterfaceName
 */

class Typeable {
  currentProcessorTask = () => Promise.resolve()
  baseObject = {}

  /**
   * @type {Options}
   */
  options = {
    outfile: 'typeable.d.ts',
    rootInterfaceName: 'TypeableObject',
  }

  /**
   * @type {Project}
   */
  tsProject

  /**
   * @type {SourceFile}
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
    this.tsProject = new Project({
      compilerOptions: {
        skipLibCheck: true,
        emitDeclarationOnly: true,
        target: ScriptTarget.ES2015,
      },
    })

    this.setupSource()
    if (process.env.NODE_ENV !== 'production') {
      this.runProcessor()
    }
  }

  setupSource() {
    this.sourceFile = this.tsProject.createSourceFile(
      this.options.outfile,
      '',
      {
        overwrite: true,
      }
    )

    this.sourceFile.addInterface({
      name: this.options.rootInterfaceName,
      isExported: true,
    })
  }

  runProcessor() {
    // add it to the next tick instead
    setTimeout(() => {
      ;(async () => {
        try {
          await this.currentProcessorTask
          await this.sourceFile.save()
          this.runProcessor()
        } catch (err) {
          console.error(err)
        }
      })()
    }, 100)
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

        self.setCurrentTreeBuilder(async () => await self.contructTypeTree())

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
  }

  get mutable() {
    return new Proxy(this.baseObject, this.proxyHandler())
  }

  setCurrentTreeBuilder(fn) {
    if (process.env.NODE_ENV == 'production') return
    this.currentProcessorTask = Promise.resolve().then(_ => fn())
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
