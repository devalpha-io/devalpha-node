const fs = require('fs')
const path = require('path')
const documentation = require('documentation')
const Metalsmith = require('metalsmith')
const collections = require('metalsmith-collections')
const drafts = require('metalsmith-drafts')
const handlebars = require('handlebars')
const headings = require('metalsmith-headings')
const layouts = require('metalsmith-layouts')
const markdown = require('metalsmith-markdown')
const permalinks = require('metalsmith-permalinks')
const sass = require('metalsmith-sass')
const ancestry = require('metalsmith-ancestry')
const uglify = require('metalsmith-uglify')
const watch = require('metalsmith-watch')

let watching = true
if (
  process.argv.indexOf('-w') === -1 &&
  process.argv.indexOf('--watch') === -1
) {
  watching = false
}

const metadata = {
  siteName: 'Vester',
  siteUrl: 'http://localhost',
  description: 'Algorithmic trading for the rest of us.',
  version: '0.0.1',
  githubUrl: 'https://github.com/fhqvst/vester',
  production: false
}

if (process.env.NODE_ENV !== 'development') {
  Object.assign(metadata, {
    siteUrl: 'https://fhqvst.github.io/vester',
    production: true
  })
}

const noop = (files, metalsmith, done) => done()

function generateContent(done) {
  handlebars.registerHelper('is', function (a, b, options) {
    return a === b ? options.fn(this) : ''
  })

  handlebars.registerHelper('isnt', function (a, b, options) {
    return a !== b ? options.fn(this) : ''
  })

  return new Promise((resolve, reject) => {
    Metalsmith(process.cwd())
      .metadata(metadata)
      .source('./docs/content')
      .destination('./.docs')
      .use(drafts())
      .use(watching ? watch({
        paths: {
          '${source}/**/*': true,
          './docs/layouts/**/*': '**/*',
          './docs/partials/**/*': '**/*'
        }
      }) : noop)
      .use(markdown())
      .use(ancestry())
      .use(headings('h2'))
      .use(permalinks({
        relative: false
      }))
      .use(layouts({
        engine: 'handlebars',
        directory: './docs/layouts',
        partials: './docs/partials',
        default: 'layout.html'
      }))
      .build((e) => {
        if (e) {
          reject(e)
        } else {
          resolve()
        }
      })
  })
}

function generateStatic(done) {
  return new Promise((resolve, reject) => {
    Metalsmith(process.cwd())
      .clean(true)
      .source('./docs/static')
      .destination('./.docs/assets/')
      .use(watching ? watch() : noop)
      .build((e) => {
        if (e) {
          reject(e)
        } else {
          resolve()
        }
      })
  })
}

function generateStyles(done) {
  return new Promise((resolve, reject) => {
    Metalsmith(process.cwd())
      .clean(true)
      .source('./docs/styles')
      .destination('./.docs/assets/styles')
      .use(watching ? watch({
        livereload: true
      }) : noop)
      .use(sass())
      .build((e) => {
        if (e) {
          reject(e)
        } else {
          resolve()
        }
      })
  })
}

function generateScripts(done) {
  return new Promise((resolve, reject) => {
    Metalsmith(process.cwd())
      .clean(true)
      .source('./docs/scripts')
      .destination('./.docs/assets/scripts')
      .use(watching ? watch() : noop)
      .use(uglify({
        concat: {
          file: 'scripts.min.js'
        },
        removeOriginal: true
      }))
      .build((e) => {
        if (e) {
          reject(e)
        } else {
          resolve()
        }
      })
  })
}

Promise.all([
  generateContent(),
  generateStatic(),
  generateStyles(),
  generateScripts()
])
.then(() => {
  const args = process.argv.slice(2)
  if (!watching) {
    process.exit()
  }
})
.catch((e) => {
  console.log(e)
})
