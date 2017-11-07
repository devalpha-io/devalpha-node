const fs = require('fs')
const path = require('path')
const documentation = require('documentation')
const Metalsmith = require('metalsmith')
const layouts = require('metalsmith-layouts')
const collections = require('metalsmith-collections')
const markdown = require('metalsmith-markdown')
const permalinks = require('metalsmith-permalinks')
const headings = require('metalsmith-headings')
const uglify = require('metalsmith-uglify')
const drafts = require('metalsmith-drafts')
const sass = require('metalsmith-sass')
const handlebars = require('handlebars')

let monitor = () => {
  return (files, metalsmith, done) => {
    console.log(Object.keys(files))
    done()
  }
}

handlebars.registerHelper('is', function (a, b, options) {
  return a === b ? options.fn(this) : ''
})

handlebars.registerHelper('isnt', function (a, b, options) {
  return a !== b ? options.fn(this) : ''
})

function generateDocs() {
  return new Promise((resolve) => {
    documentation.build([path.resolve(process.cwd(), 'lib', '**', '*')], {})
      .then(documentation.formats.md)
      .then(output => {
        output = `---
title: API
layout: layout.html
---
    ` + output
        fs.writeFileSync(path.resolve(process.cwd(), 'docs', 'content', 'api', 'API.md'), output)
        console.log('Generated documentation')
        resolve()
      })
  })
}

const sorted = (a, b) => {
  console.log(a.path, b.path)
  if (a.path.indexOf('index') > -1) return 1
  return a.path <= b.path ? -1 : 1
}

function generateContent(cb) {
  Metalsmith(process.cwd())
    .metadata({
      siteName: "Vester",
      siteUrl: "https://fhqvst.github.io/vester",
      description: "Algorithmic trading for the rest of us.",
      version: '0.0.1',
      githubUrl: "https://github.com/fhqvst/vester"
    })
    .clean(true)
    .source('./docs/content')
    .destination('./.docs')
    .use(drafts())
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
    .build((err) => {
      if (err) {
        throw err
      } else {
        console.log('Generated content')
        cb()
      }
    })
}


function generateStatic() {
  Metalsmith(process.cwd())
    .clean(true)
    .source('./docs/static')
    .destination('./.docs/assets/')
    .build((err) => {
      if (err) {
        throw err
      } else {
        console.log('Generated static assets')
      }
    })
}

function generateStyles() {
  Metalsmith(process.cwd())
    .clean(true)
    .source('./docs/styles')
    .destination('./.docs/assets/styles')
    .use(sass())
    .build((err) => {
      if (err) {
        throw err
      } else {
        console.log('Generated styles')
      }
    })
}

function generateScripts() {
  Metalsmith(process.cwd())
    .clean(true)
    .source('./docs/scripts')
    .destination('./.docs/assets/scripts')
    .use(uglify({
      concat: {
        file: 'scripts.min.js'
      },
      removeOriginal: true
    }))
    .build((err) => {
      if (err) {
        throw err
      } else {
        console.log('Generated scripts')
      }
    })
}

const args = process.argv.slice(2)
if (args.find(a => a === '--docs')) {
  generateDocs().then(process.exit)
} else {
  generateContent(() => {
    generateStatic()
    generateStyles()
    generateScripts()
  })
}
