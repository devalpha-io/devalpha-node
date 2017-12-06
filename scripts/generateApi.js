const fs = require('fs')
const path = require('path')
const documentation = require('documentation')

function buildApi() {
  return documentation.build([path.resolve(process.cwd(), 'lib', '**', '*')], {})
    .then((comments) => documentation.formats.md(comments, {
      markdownToc: true
    }))
    .then(output => {
      let content = ''

      content += '---\n'
      content += 'title: API\n'
      content += '---\n\n'
      content += '# API\n\n'

      /* remove documentation.js comment */
      output = output.substring(output.indexOf('\n') + 1)

      /* add metadata */
      content += output

      fs.writeFileSync(path.resolve(process.cwd(), 'docs', 'source', 'prologue', 'api', 'index.md'), content)
    })
}

buildApi()
  .then(() => console.log('Generated API.md'))
  .catch(console.error)

