import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import uglify from 'rollup-plugin-uglify'

const env = process.env.NODE_ENV
console.log(env)
const config = {
  input: 'lib/index.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers']
    }),
    commonjs({
      include: ['node_modules/**'],
      namedExports: {
        immutable: ['Map', 'List', 'is'],
        mathjs: [
          'add',
          'bignumber',
          'chain',
          'max',
          'mean',
          'min',
          'multiply',
          'number',
          'sign',
          'sqrt',
          'std',
          'subtract'
        ]
      }
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    })
  ]
}

if (env === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  )
}

export default config
