import { test } from 'uvu'
import { createTypeable } from '../src/index.js'
import assert from 'uvu/assert'
import { promises as fs, existsSync } from 'fs'
import { GENERIC_FUNCTION_DEF } from '../src/utils'

const testOutfile = 'test_typeable.d.ts'

async function onReady(fn) {
  return new Promise(resolve => {
    setTimeout(() => {
      ;(async () => {
        await fn()
        resolve()
      })()
    }, 500)
  })
}

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
      assert.ok(data.indexOf(`method: ${GENERIC_FUNCTION_DEF}`) > -1)
      assert.ok(data.indexOf(`subFunction: ${GENERIC_FUNCTION_DEF}`) > -1)
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
      assert.ok(data.indexOf(`method: ${GENERIC_FUNCTION_DEF}`) > -1)
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

test.run()
