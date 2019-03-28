const fs = require('fs')
const path = require('path')
const util = require('util')
const folderPath = path.join(__dirname, '../boot')
const fileList = fs.readdirSync(folderPath).sort()

/**
 * translate function to Async function
 * @param {Function} functionName function name
 * @param {*} app app instance
 * @return {Function} callback func
 */
function func2P(functionName, app) {
  return util.promisify(functionName)
}
/**
 * execute boot scripts
 * @param {*} app app instance
 * @return {Null}
 */
async function exec(app = {}) {
  for (const fileName of fileList) {
    const functionName = require(path.join(folderPath, fileName))
    const funcP = func2P(functionName)
    await functionName(app)
  }
  return
}

exec({})
