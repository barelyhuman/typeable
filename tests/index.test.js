import { test } from 'uvu'
import { createTypeable } from '../src/index.js'
import assert from 'uvu/assert'
import { promises as fs, existsSync } from 'fs'
import { getFunctionParamString } from '../src/utils'
import { onReady } from './helpers.js'

const testOutfile = 'test_typeable.d.ts'

test.before(async () => {
  await fs.unlink(testOutfile)
})

test('base test', () => {
  const a = createTypeable(
    {},
    {
      outfile: 'test_typeable.d.ts',
    }
  )
  a.app = function () {}
  assert.ok(a instanceof Object)
})

test('test addition of sub functions and methods', async () => {
  const a = createTypeable(
    {},
    {
      outfile: 'test_typeable.d.ts',
    }
  )
  a.app = {
    method() {},
  }
  a.app.subFunction = function () {}

  assert.ok(a instanceof Object)

  await onReady(async () => {
    if (existsSync('test_typeable.d.ts')) {
      const data = await fs.readFile('test_typeable.d.ts', 'utf8')

      assert.ok(data.indexOf('interface app') > -1)
      assert.ok(
        data.indexOf(`method: ${getFunctionParamString(a.app.method)}`) > -1
      )
      assert.ok(
        data.indexOf(
          `subFunction: ${getFunctionParamString(a.app.subFunction)}`
        ) > -1
      )
    }
  })
})

test('test addition of string and bools', async () => {
  const a = createTypeable(
    {},
    {
      outfile: 'test_typeable.d.ts',
    }
  )

  a.app = {
    bool: true,
    string: 'string',
  }

  assert.ok(a instanceof Object)

  await onReady(async () => {
    if (existsSync('test_typeable.d.ts')) {
      const data = await fs.readFile('test_typeable.d.ts', 'utf8')

      assert.ok(data.indexOf('interface app') > -1)
      assert.ok(data.indexOf(`bool: boolean`) > -1)
      assert.ok(data.indexOf(`string: string`) > -1)
    }
  })
})

test('test addition of sub interfaces', async () => {
  const a = createTypeable(
    {},
    {
      outfile: 'test_typeable.d.ts',
    }
  )

  a.app = {}
  a.app.subInteface = {}
  a.app.subInteface.method = function () {}

  assert.ok(a instanceof Object)

  await onReady(async () => {
    if (existsSync('test_typeable.d.ts')) {
      const data = await fs.readFile('test_typeable.d.ts', 'utf8')

      assert.ok(data.indexOf('interface app') > -1)
      assert.ok(data.indexOf(`app: app`) > -1)
      assert.ok(data.indexOf(`interface app_subInteface`) > -1)
      assert.ok(data.indexOf(`subInteface: app_subInteface`) > -1)
      assert.ok(
        data.indexOf(
          `method: ${getFunctionParamString(a.app.subInteface.method)}`
        ) > -1
      )
    }
  })
})

test('test addition of null props', async () => {
  const a = createTypeable(
    {},
    {
      outfile: 'test_typeable.d.ts',
    }
  )

  a.appNull = null
  a.appUndef = undefined

  assert.ok(a instanceof Object)

  await onReady(async () => {
    if (existsSync('test_typeable.d.ts')) {
      const data = await fs.readFile('test_typeable.d.ts', 'utf8')
      assert.ok(data.indexOf('appNull: null') > -1)
      assert.ok(data.indexOf('appUndef: undefined') > -1)
    }
  })
})

test('test addition of function with more than one parameter', async () => {
  const a = createTypeable(
    {},
    {
      outfile: 'test_typeable.d.ts',
    }
  )

  a.app = {}
  a.app.function = function (arg) {}
  a.app.function2 = function (arg, arg2) {}
  a.app.function3 = (arg, arg2) => {}
  a.app.function4 = async (arg, arg2) => {}

  assert.ok(a instanceof Object)

  await onReady(async () => {
    if (existsSync('test_typeable.d.ts')) {
      const data = await fs.readFile('test_typeable.d.ts', 'utf8')
      assert.ok(
        data.indexOf(`function: ${getFunctionParamString(a.app.function)}`) > -1
      )
      assert.ok(
        data.indexOf(`function2: ${getFunctionParamString(a.app.function2)}`) >
          -1
      )
      assert.ok(
        data.indexOf(`function3: ${getFunctionParamString(a.app.function3)}`) >
          -1
      )
      assert.ok(
        data.indexOf(`function4: ${getFunctionParamString(a.app.function4)}`) >
          -1
      )
    }
  })
})

test.run()
