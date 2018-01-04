const path = require('path')

module.exports = {
  entry: './lib/index.js',
  // target: 'node',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'vester'
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
  }
}
