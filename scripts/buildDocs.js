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
const uglify = require('metalsmith-uglify')
const watch = require('metalsmith-watch')

let watching = false
if (
  process.argv.indexOf('-w') == -1 &&
  process.argv.indexOf('--watch') == -1
) {
  watching = true
}

let metadata = {
  siteName: "Vester",
  siteUrl: "http://localhost",
  description: "Algorithmic trading for the rest of us.",
  version: '0.0.1',
  githubUrl: "https://github.com/fhqvst/vester",
  production: false
}

if (process.env.NODE_ENV !== 'development') {
  Object.assign(metadata, {
    siteUrl: "https://fhqvst.github.io/vester",
    production: true
  })
}

function generateContent(done) {
  handlebars.registerHelper('is', function (a, b, options) {
    return a === b ? options.fn(this) : ''
  })

  handlebars.registerHelper('isnt', function (a, b, options) {
    return a !== b ? options.fn(this) : ''
  })

  const sorted = (a, b) => {
    console.log(a.path, b.path)
    if (a.path.indexOf('index') > -1) return 1
    return a.path <= b.path ? -1 : 1
  }

  return new Promise((resolve, reject) => {
    Metalsmith(process.cwd())
        .metadata(metadata)
        .source('./docs/content')
        .destination('./.docs')
        .use(drafts())
        .use(watching ? undefined : watch({
          paths: {
            '${source}/**/*': true,
            './docs/layouts/**/*': '**/*'
          }
        }))
        .use(collections({
          'Prologue': {
            pattern: '*.md',
            reverse: true,
            sortBy: sorted
          },
          'Event Flow': {
            pattern: 'event-flow/*.md',
            sortBy: sorted
          },
          'Getting Started': {
            pattern: 'getting-started/*.md',
            sortBy: sorted
          },
          'Backtesting': {
            pattern: 'backtesting/*.md',
            sortBy: sorted
          },
          'Platforms': {
            pattern: 'platforms/*.md',
            sortBy: sorted
          },
          'API Reference': {
            pattern: 'api/*.md',
            sortBy: sorted
          }
        }))
        .use(markdown())
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
        .use(watching ? undefined : watch())
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
        .use(watching ? undefined : watch({
          livereload: true
        }))
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
        .use(watching ? undefined : watch())
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
  if (watching) {
    process.exit()
  }
})
.catch((e) => {
  console.error(e)
})
