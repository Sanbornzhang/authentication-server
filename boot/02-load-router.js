const fs = require('fs')
const path = require('path')
const loadYaml = require('../utils/load-yaml')

const folderPath = path.join(__dirname, '../model')
const baseDefineYamlPath = path.join(__dirname, '../model', 'base.yaml')
const baseDefinition = loadYaml(baseDefineYamlPath)
const baseMethodDefine = baseDefinition.methods

/**
 * hook function
 * @param {*} ctx
 * @param {*} next
 */
function hook(ctx, next) {
  next()
}
/**
 * execute function
 * @param {*} ctx
 * @param {*} next
 * @param {Instance} Instance
 * @param {String} method Name
 * @param {Object} methodDefine
 */
async function exec(ctx, next, Instance, method, methodDefine) {
  await Instance[method](ctx.query)
  next()
}
const beforeHook = hook
const afterHook = hook

/**
 * defineRouter
 * @param {router} router app.router
 * @param {Object} definition
 * @param {Instance} Instance
 * @param {logger} log
 */
function defineRouter(router, definition, Instance, log) {
  Object.keys(definition).forEach(method=>{
    const httpMethod = definition[method].http.method || 'GET'
    const httpPath = path.posix.join('/', Instance.modelName.toLowerCase(), definition[method].http.path)
    log.info(`Create Router| method: ${httpMethod}, path: ${httpPath}`)
    router[httpMethod.toLowerCase()](
      httpPath,
      beforeHook,
      (ctx, next)=>{
        exec(ctx, next, Instance.model, method, definition[method])
      },
      afterHook)
  })
}
/**
 * loadRouter
 * @param {AppInstance} app
 */
function loadRouterDefine(app) {
  // duplicate code
  const fileList = fs.readdirSync(folderPath)
  const defineYAML = fileList.filter(filename => filename !== 'base.yaml' && path.extname(filename) === '.yaml')
  const defineList = defineYAML.map(filename => {
    const filePath = path.join(folderPath, filename)
    return loadYaml(filePath)
  })
  for ( const modelDefinition of defineList) {
    const defineMethods = modelDefinition.methods || {}
    const Instance = app.context.Models[modelDefinition.name]
    defineRouter(app.router, baseMethodDefine, Instance, app.context.logger)
    defineRouter(app.router, defineMethods, Instance, app.context.logger)
  }
}
module.exports = (app)=>{
  loadRouterDefine(app)
  return Promise.resolve()
}
