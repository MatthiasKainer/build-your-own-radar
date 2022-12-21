const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path')
const webpack = require('webpack')
const buildPath = path.resolve(__dirname, 'lib')
const main = ['./src/site.js']
const fs = require('fs')
const route = require('./webpack.route.js')
const config = require('./src/config')['production']
const featureTogglesList = Object.keys(config.featureToggles)
const scssVariables = featureTogglesList.map((x) => `$${x}:${config.featureToggles[x]};`).join('\n')

fs.writeFileSync(path.join(__dirname, './src/stylesheets/_featuretoggles.scss'), scssVariables)

module.exports = merge(common, {
  mode: 'production',
  entry: { main },
  performance: {
    hints: false,
  },
  target: "web",
  output: {
    path: buildPath,
    filename: '[name].js',
    assetModuleFilename: 'images/[name][ext]',
    library: {
      type: "module"
    },
  },
  experiments: {
    outputModule: true
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.ENVIRONMENT': 'production',
    }),
  ],
  devtool: 'source-map',
  devServer: {
    static: { directory: buildPath },
    host: '0.0.0.0',
    port: 8080,
    setupMiddlewares: route,
  },
})
