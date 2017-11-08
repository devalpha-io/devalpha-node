const fs = require('fs')
const path = require('path')
const documentation = require('documentation')

function buildApi() {
  return documentation.build([path.resolve(process.cwd(), 'lib', '**', '*')], {})
    .then(documentation.formats.md)
    .then(output => {

      /* remove documentation.js comment */
      output = output.substring(output.indexOf('\n') + 1)

      /* add metadata */
      output = '--- \n' + output
      output = 'title: API \n' + output
      output = '--- \n' + output

      fs.writeFileSync(path.resolve(process.cwd(), 'docs', 'content', 'api', 'API.md'), output)
    })
}

buildApi()
  .then(() => console.log('Generated API.md'))
  .catch(console.error)

