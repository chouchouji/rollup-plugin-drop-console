# rollup-plugin-drop-console

> A rollup plugin used to drop `(window).console.*` (e.g. console.log). It only processes expression. If you use console.log as a variable property or the text content of a DOM node, it will be ignored.

## Installation

```shell
# pnpm
pnpm add -D rollup-plugin-drop-console

# yarn
yarn add -D rollup-plugin-drop-console

# npm
npm add -D rollup-plugin-drop-console
```

## Usage

### rollup

```js
// rollup.config.mjs
import dropConsole from 'rollup-plugin-drop-console'

export default {
  input: ['entry.js'],
  output: {
    dir: 'dist',
    format: 'es'
  },
  plugins: [
    dropConsole({
      functions: ['log', 'info']
    })
  ]
};
```

We hope to remove log and info function and keep error function form our code. The above code transforms

```js
console.log('test')

window.console.info('info')

console.error('error')
```

into 

```js
console.error('error')
```

### Vite

If want to use this plugin in vite, The configuration is the same. But recommended for `build mode`, you maybe need use console to debug when `serve mode`.

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dropConsole from 'rollup-plugin-drop-console'

export default defineConfig(({ command }) => {
  const isBuildCommand = command === 'build'

  const plugins = [
    vue()
  ]

  if (isBuildCommand) {
    plugins.push(
      dropConsole({
        functions: ['log', 'info']
      })
    )
  }

  return {
    plugins,
  }
})
```

## API

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `include` | `string \| RegExp \| (string \| RegExp)[] \| undefined`  | `/\.(js\|ts\|jsx\|tsx)$/` | `files to process` |
| `exclude` | `string \| RegExp \| (string \| RegExp)[] \| undefined`  | `/node_modules/` | `files to ignore` |
| `sourceMap` | `boolean \| undefined`  | `true` | `whether to generate source map` |
| `functions` | `ConsoleFunction[] \| undefined`  | `['log']` | `console functions to remove` |

> **Note**: If functions is set `[]`, no any functions will be transformed.

## Types

```ts
type ConsoleFunction =
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

interface RollupPluginDropConsoleOptions {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  sourceMap?: boolean;
  functions?: ConsoleFunction[];
}
```

## Feedback

If you encounter problems or have good ideas and suggestions, please [report](https://github.com/chouchouji/rollup-plugin-drop-console/issues) here.

## License

[MIT](LICENSE)
