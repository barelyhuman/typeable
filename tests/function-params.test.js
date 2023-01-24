import { test } from 'uvu'
import assert from 'uvu/assert'

import { getFunctionParamString } from '../src/utils'

test('no params', () => {
  const func = () => {}
  const expected = '() => any'
  const value = getFunctionParamString(func)
  assert.equal(value, expected)
})

test('1 param', () => {
  const func = arg => {}
  const expected = '(param0: any) => any'
  const value = getFunctionParamString(func)
  assert.equal(value, expected)
})

test('multi param', () => {
  const func = (arg, arg2) => {}
  const func2 = (arg, arg2, arg3) => {}
  const expected = '(param0: any, param1: any) => any'
  const expected2 = '(param0: any, param1: any, param2: any) => any'
  const value = getFunctionParamString(func)
  const value2 = getFunctionParamString(func2)

  assert.equal(value, expected)
  assert.equal(value2, expected2)
})

test.run()
