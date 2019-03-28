const fs = require('fs')
const path = require('path')

/**
 * execute boot scripts
 * @param {*} app app instance
 * @param {String} folderPath file path
 * @return {Promise}
 */
async function exec(app = {}, folderPath) {
  const fileList = fs.readdirSync(folderPath).sort()
  for (const fileName of fileList) {
    const func = require(path.join(folderPath, fileName))
    await func(app)
  }
  return
}

module.exports = exec
