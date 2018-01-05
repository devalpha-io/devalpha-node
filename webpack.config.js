const webpack = require('webpack')
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin

const env = process.env.WEBPACK_ENV
const plugins = [
  new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  })
]

const libraryName = 'vester'

let outputFile
if (env === 'production') {
  plugins.push(new UglifyJsPlugin())
  outputFile = libraryName + '.min.js'
} else {
  outputFile = libraryName + '.js'
}

module.exports = {
  entry: './lib/index.js',
  output: {
    path: __dirname + '/build/umd',
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['babel-preset-env'],
            plugins: [
              'transform-async-to-generator',
              'transform-object-rest-spread'
            ]
          }
        }
      }
    ]
  },
  plugins
}
