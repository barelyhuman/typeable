import { test } from 'uvu'
import assert from 'uvu/assert'
import { createTypeable } from '../src'
import { onReady } from './helpers'
import { promises as fs, existsSync } from 'fs'

test('basic one level cyclic dep', async () => {
  const cyclic = {
    left: 1,
  }

  const a = createTypeable(cyclic, {
    outfile: 'test_typeable.d.ts',
  })

  a.right = cyclic

  await onReady(async () => {
    if (!existsSync('test_typeable.d.ts')) {
      return
    }
    const data = await fs.readFile('test_typeable.d.ts', 'utf8')
    assert.ok(data.indexOf('left: number') > -1)
    assert.ok(data.indexOf('right: right') > -1)
    assert.match(data, /interface right \{\n\tleft: number\n\}/)
  })
  assert.ok(a instanceof Object)
})

test.run()
