import { ComponentClass } from 'react'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/reporters/default'
import * as React from 'react'

const noop = () => {}

export type PropType = t.InterfaceType<any> | t.RefinementType<t.InterfaceType<any>> | t.UnionType<any, any>;

export type Options = {
  strict?: boolean,
  children?: t.Type<any>
};

function getExcessProps(values: Object, props: t.Props): Array<string> {
  const excess: Array<string> = []
  for (let k in values) {
    if (k !== 'children' && !props.hasOwnProperty(k)) {
      excess.push(k);
    }
  }
  return excess
}

function getProps(values: any, type: PropType): t.Props {
  if (type instanceof t.InterfaceType) {
    return type.props
  }
  if (type instanceof t.UnionType) {
    for (const u of type.types) {
      if (u.is(values)) {
        return getProps(values, u)
      }
    }
  }
  return getProps(values, (type as any).type)
}

export function getPropTypes(type: PropType, options: Options = { strict: true }) {
  return {
    __prop_types_ts(values: any, prop: string, displayName: string): Error | null {
      const validation = t.validate(values, type)
        .chain(v => {
          if (options.children) {
            return options.children.validate(values.children, [{ key: 'children', type: options.children }])
          }
          return t.success(v)
        })
      return validation.fold(
        () => new Error('\n' + PathReporter.report(validation).join('\n')),
        () => {
          if (options.strict) {
            const excess = getExcessProps(values, getProps(values, type))
            if (excess.length > 0) {
              return new Error(`\nInvalid additional prop(s): ${JSON.stringify(excess)}`);
            }
          }
          return null
        }
      )
    }
  }
}

export function props(type: PropType, options?: Options): (C: ComponentClass<any>) => void {
  if (process.env.NODE_ENV !== 'production') {
    const propsTypes = getPropTypes(type, options)
    return function (Component) {
      Component.propTypes = propsTypes
    }
  }
  return noop
}

export const ReactElement = new t.Type<React.ReactElement<any>>(
  'ReactElement',
  (v, c) => React.isValidElement(v) ? t.success(v) : t.failure<React.ReactElement<any>>(v, c)
)

export const ReactChild = new t.Type<React.ReactChild>(
  'ReactChild',
  (v, c) => t.string.is(v) || t.number.is(v) || ReactElement.is(v) ? t.success(v) : t.failure<React.ReactChild>(v, c)
)

export const ReactFragment: t.Type<React.ReactFragment> = new t.Type<React.ReactFragment>(
  'ReactFragment',
  (v, c) => t.Dictionary.is(v) || t.array(ReactNode).is(v) ? t.success(v) : t.failure<React.ReactFragment>(v, c)
)

export const ReactNode = new t.Type<React.ReactNode>(
  'ReactNode',
  (v, c) => ReactChild.is(v) || ReactFragment.is(v) || t.boolean.is(v) || t.null.is(v) || t.undefined.is(v) ? t.success(v) : t.failure<React.ReactNode>(v, c)
)

