import { walk, type Node } from 'estree-walker'
import MagicString from 'magic-string'
import { createFilter, type FilterPattern } from '@rollup/pluginutils'
import type { Plugin } from 'rollup'

export type ConsoleFunction =
  | 'log'
  | 'error'
  | 'warn'
  | 'table'
  | 'time'
  | 'timeEnd'
  | 'timeLog'
  | 'timeStamp'
  | 'trace'
  | 'table'
  | 'info'
  | 'profile'
  | 'profileEnd'
  | 'assert'
  | 'clear'
  | 'context'
  | 'count'
  | 'countReset'
  | 'createTask'
  | 'debug'
  | 'dir'
  | 'dirxml'
  | 'group'
  | 'groupEnd'
  | 'groupCollapsed'

export interface RollupPluginDropConsoleOptions {
  /**
   * A picomatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should operate on.
   * By default all js(x), ts(x) files are targeted.
   * @default /\.(js|ts|jsx|tsx)$/
   */
  include?: FilterPattern
  /**
   * A picomatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should _ignore_.
   * By default all node modules files are ignored.
   * @default /node_modules/
   */
  exclude?: FilterPattern
  /**
   * If `true`, instructs the plugin to update source maps accordingly after removing configured
   * targets from the bundle.
   * @default true
   */
  sourceMap?: Boolean
  /**
   * The functions you want to remove which can be called by console.
   * If the value is empty array, it will not transform any code.
   * @default ['log']
   */
  functions?: ConsoleFunction[]
}

/**
 * check it is virtual module or not
 * @param {string} id module id
 * @returns {boolean}
 */
function isVirtualModule(id: string) {
  return id.startsWith('\0')
}

/**
 * check it is console
 * @param {string} name the name of object or property
 * @returns {boolean}
 */
function isConsole(name: string) {
  return name === 'console'
}

function hasMatchedExpression(expression: any, functions: ConsoleFunction[]) {
  const hasMatchedFunction =
    expression.callee && expression.callee.property && functions.includes(expression.callee.property.name)

  // if the property exists and its value is include the functions (e.g. log) set by developer, continue
  // otherwise, return false
  if (!hasMatchedFunction) {
    return false
  }

  // if object is console, it indicates that the call expression is right (e.g. console.log)
  if (expression.callee.object && isConsole(expression.callee.object.name)) {
    return true
  }

  // if object is window its property is console, it indicates that the call expression is right (e.g. window.console.log)
  return (
    expression.callee.object.object &&
    expression.callee.object.object.name === 'window' &&
    expression.callee.object.property &&
    isConsole(expression.callee.object.property.name)
  )
}

export default function dropConsolePlugin({
  include = /\.(js|ts|jsx|tsx)$/,
  exclude = /node_modules/,
  sourceMap = true,
  functions = ['log'],
}: RollupPluginDropConsoleOptions): Plugin {
  const filter = createFilter(include, exclude)
  return {
    name: 'rollup-plugin-drop-console',
    transform(code: string, id: string) {
      // if functions are empty, return
      if (!(Array.isArray(functions) && functions.length > 0)) {
        return
      }

      if (!isVirtualModule(id) && !filter(id)) {
        return
      }

      let ast

      try {
        ast = this.parse(code)
      } catch (err: any) {
        this.debug({
          message: `Failed to parse code, skip ${id}`,
          cause: err,
        })
        return
      }

      const magicString = new MagicString(code)

      walk(ast, {
        enter(node) {
          const { start, end } = node as Node & { start: number, end: number }
          if (sourceMap) {
            magicString.addSourcemapLocation(start)
            magicString.addSourcemapLocation(end)
          }

          if (
            node.type === 'ExpressionStatement' &&
            node.expression.type === 'CallExpression' &&
            hasMatchedExpression(node.expression, functions)
          ) {
            magicString.remove(start, end)
          }
        },
      })

      code = magicString.toString()
      const map = sourceMap ? magicString.generateMap() : null

      return {
        code,
        map,
      }
    },
  }
}
