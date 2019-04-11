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
 * arg params Check
 * @param {*} params params
 * @param {*} argDefine arg define
 * @return {Promise}
 */
function argCheck(params, argDefine = {}) {
  return new Promise((resolve, reject)=>{
    if (!Object.keys(argDefine) || !argDefine.arg) {
      return reject(new Error('arg definition Error'))
    }
    argDefine.type = argDefine.type || 'string'
    argDefine.required = argDefine.required || false
    let arg = params[argDefine.arg]
    if (argDefine.type.toLowerCase() === 'instance') {
      arg = params
    }
    if (argDefine.required && !arg) {
      return reject(new Error(`${argDefine.arg} is required`))
    }
    return resolve(arg)
  })
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
  // TODO:
  // error handing on last call
  const args = []
  const argsDefine = methodDefine.accepts || []
  methodDefine.http.method = methodDefine.http.method || 'get'
  for (const argDefine of argsDefine) {
    argDefine.source = argDefine.source || 'url'
    let params;
    if (argDefine.source == 'url') {
      params = Object.assign(ctx.query, ctx.params)
    }
    if (argDefine.source == 'body') {
      params = Object.assign(ctx.body, ctx.params)
    }
    // TODO:
    // If is instance will check params on model definition
    const arg = await argCheck(params, argDefine)
    args.push(arg)
  }
  const data = await Instance[method](...args)
  ctx.body = data
  return next()
}

const beforeHook = hook
const afterHook = hook

/**
 * define Swagger API Document
 * @param {*} app
 * @param {String} modelName
 * @param {*} definition
 * @param {String} httpPath
 * @param {String} httpMethod
 */
function defineSwaggerAPIDoc(app, modelName, definition, httpPath, httpMethod) {
  const apiDefinition = {}
  // define response
  const responses = {}
  const statusCode = definition.return.code || 200
  const type = definition.return.httpType || 'application/json'
  responses[statusCode] = {
    description: definition.return.description,
  }
  responses[statusCode]['content'] = {}
  responses[statusCode]['content'][type] = {
    schema: {
      type: definition.return.type,
    },
  }
  // define parameters
  const parameters = []
  for (const defineParameter of definition.accepts) {
    const swaggerParameter = {}
    swaggerParameter.name = defineParameter.arg
    // TODO:
    // swaggerParameter.in = definition.http.
    swaggerParameter.required = defineParameter.required || false
    swaggerParameter.description = defineParameter.description
    swaggerParameter.schema = {type: defineParameter.type}
    parameters.push(swaggerParameter)
  }
  apiDefinition.description = definition.description
  apiDefinition.responses = responses
  apiDefinition.tags = [modelName]
  app.paths = app.paths || {}
  app.paths[httpPath] = app.paths[httpPath] || {}
  app.paths[httpPath][httpMethod] = apiDefinition
}
/**
 * defineRouter
 * @param {router} router app.router
 * @param {Object} definition
 * @param {Instance} Instance
 * @param {logger} log
 * @param {app} app koa app instance
 */
function defineRouter(router, definition, Instance, log, app) {
  Object.keys(definition).forEach(method=>{
    const httpMethod = definition[method].http.method.toLowerCase() || 'get'
    const httpPath = path.posix.join('/', Instance.modelName.toLowerCase(), definition[method].http.path)
    log.info(`Create Router| method: ${httpMethod}, path: ${httpPath}`)
    router[httpMethod](
      httpPath,
      beforeHook,
      (ctx, next)=>{
        return exec(ctx, next, Instance.model, method, definition[method])
      },
      // afterHook
    )
    defineSwaggerAPIDoc(app, Instance.modelName, definition[method], httpPath, httpMethod)
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
    defineRouter(app.router, baseMethodDefine, Instance, app.context.logger, app)
    defineRouter(app.router, defineMethods, Instance, app.context.logger, app)
  }
}
module.exports = (app)=>{
  loadRouterDefine(app)
  return Promise.resolve()
}
