const readYML = require('js-yaml')
const fs = require('fs')

module.exports = filePath => readYML.safeLoad(fs.readFileSync(filePath))
