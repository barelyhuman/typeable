import { test } from 'uvu'
import { createTypeable } from '../src/index.js'
import assert from 'uvu/assert'

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

test.run()
