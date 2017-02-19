import * as assert from 'assert'
import { getPropTypes, Options, ReactElement, ReactNode, ReactFragment, PropType } from '../src/index'
import * as t from 'io-ts'
import * as React from 'react'

function runPropTypes(propTypes: { __prop_types_ts: Function }, values: Object): Error | null {
  return propTypes.__prop_types_ts(values, '__prop_types_ts', '<diplayName>');
}

function assertError(type: PropType, values: Object, message: string, options?: Options) {
  const error = runPropTypes(getPropTypes(type, options), values)
  if (error !== null) {
    assert.strictEqual(error.message, message)
  } else {
    assert.ok(false)
  }
}

function assertNoError(type: PropType, values: Object, options?: Options) {
  const error = runPropTypes(getPropTypes(type, options), values)
  assert.strictEqual(error, null)
}

describe('getPropTypes', () => {

  it('should check bad values', function () {
    const T = t.interface({ name: t.string })
    assertError(T, {}, '\nInvalid value undefined supplied to : { name: string }/name: string')
    assertNoError(T, { name: 'name' })
  });

  it('should check excess props', function () {
    const T = t.interface({ name: t.string })
    assertError(T, { name: 'name', a: 1 }, '\nInvalid additional prop(s): ["a"]')
  });

  it('should handle strict = false option', function () {
    const T = t.interface({ name: t.string })
    assertNoError(T, { name: 'name', a: 1 }, { strict: false })
  });

  it('should handle children option', function () {
    const T = t.interface({ name: t.string })
    assertNoError(T, { name: 'name', children: 1 }, { children: t.number })
    assertError(T, { name: 'name', children: 's' }, '\nInvalid value "s" supplied to children: number', { children: t.number })
  });

  it('should handle refinements', function () {
    const T = t.refinement(t.interface({ a: t.number }), v => v.a >= 0)
    assertNoError(T, { a: 1 })
    assertError(T, { a: -1 }, '\nInvalid value {"a":-1} supplied to : ({ a: number } | <function1>)')
  });

  it('should handle unions', function () {
    const T = t.union([t.interface({ a: t.string }), t.interface({ b: t.number })])
    assertNoError(T, { a: 's' })
    assertNoError(T, { b: 1 })
    assertError(T, { a: 's', b: 1 }, '\nInvalid additional prop(s): ["b"]')
  });

})

describe('Pre-defined types', () => {

  it('ReactElement', function () {
    assert.ok(ReactElement.is(<div />))
  });

  it('ReactFragment', function () {
    assert.ok(ReactFragment.is(<div />))
    assert.ok(ReactFragment.is([<div />, <span />]))
  });

  it('ReactNode', function () {
    assert.ok(ReactNode.is(<div />))
    assert.ok(ReactNode.is(false))
    assert.ok(ReactNode.is(null))
  });

})
