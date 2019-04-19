const fs = require('fs')
const util = require('util')
const path = require('path')
const jwt = require('jsonwebtoken')
const loadYaml = require('../utils/load-yaml')
const Promise = require('bluebird')
const folderPath = path.join(__dirname, '../model')
const baseDefineYamlPath = path.join(__dirname, '../model', 'base.yaml')
const baseDefinition = loadYaml(baseDefineYamlPath)
const baseMethodDefine = baseDefinition.methods

let logger;
/**
 * check user access
 * @param {*} ctx koa ctx
 * @param {*} acl acl define
 * @param {string} methodName request method name
 * @return {Promise}
 */
function accessCheck(ctx, acl, methodName) {
  /**
   * check user role allow request this method
   * @param {String} authorization
   * @param {String} secretKey
   * @param {String} methodName
   * @return {Promise}
   */
  function userRoleAccessCheck(authorization, secretKey, methodName) {
    if (!authorization) {
      return Promise.resolve(false)
    }
    let authData = {}
    try {
      authData = jwt.verify(authorization, secretKey)
    } catch (error) {
    }
    if (!authData.expireDate) {
      return Promise.resolve(false)
    }
    const result = authData.expireDate > Date.now()
    // TODO: check user role on user Role Permission
    return Promise.resolve(result)
  }

  const header = ctx.request.header
  // check acl
  if (acl && acl === 'everyone') {
    return Promise.resolve(true)
  }
  const secretKey = ctx.configOptions.jwt.secretKey
  return userRoleAccessCheck(header.authorization, secretKey, methodName)
  .then(result=>{
    if (!result) {
      const error = new Error()
      error.code = 401
      error.message = 'Authentication authority failed'
      error.name = 'AUTHENTICATION_AUTH_FAILED'
      return Promise.reject(error)
    }
    return Promise.resolve(true)
  })
}
/**
 * hook function
 * @param {*} ctx
 * @param {*} methodDefine
 * @param {*} next
 * @return {Next} next
 */
function hook(ctx, methodDefine, next) {
  // console.log('beforeHook', ctx.request, methodDefine)
  logger = logger || ctx.logger
  return accessCheck(ctx, methodDefine.acl, methodDefine.name)
  .then(_=>{
    return next()
  })
}
/**
 * arg params Check
 * @param {ctx} ctx ctx
 * @param {*} argDefine arg define
 * @return {Promise}
 */
function argCheck(ctx, argDefine = {}) {
  let params;
  argDefine.source = argDefine.source || 'url'
  if (argDefine.source === 'url' || argDefine.source === 'path') {
    params = Object.assign(ctx.query, ctx.params)
  }
  if (argDefine.source === 'body') {
    params = Object.assign(ctx.body, ctx.params)
  }
  return new Promise((resolve, reject)=>{
    if (!Object.keys(argDefine) || !argDefine.arg) {
      return reject(new Error('arg definition Error'))
    }
    argDefine.type = argDefine.type || 'string'
    argDefine.required = argDefine.required || false
    let arg = params[argDefine.arg]
    // TODO: if is instance should be all payload not payload[instanceName]
    // TODO: need parse other data type
    if (arg) {
      if (argDefine.type.toLowerCase() === 'object') {
        try {
          arg = JSON.parse(arg)
        } catch (error) {
          return reject(error)
        }
      }
    }
    if (argDefine.required && !arg) {
      return reject(new Error(`${argDefine.arg} is required`))
    }
    return resolve(arg)
  })
}

/**
 * args parameter check
 * @param {*} ctx
 * @param {*} argsDefine
 * @return {Promise[]}
 */
function argsChecks(ctx, argsDefine = []) {
  return Promise.reduce(argsDefine, (args, argDefine)=>{
    return argCheck(ctx, argDefine)
    .then(_=>{
      args.push(_)
      return args
    })
  }, [])
}
/**
 * execute function
 * @param {*} ctx
 * @param {Instance} Instance
 * @param {String} method Name
 * @param {Object} methodDefine
 * @param {*} next
 * @return {Promise}
 */
function exec(ctx, Instance, method, methodDefine, next) {
  logger = logger || ctx.logger
  const argsDefine = methodDefine.accepts || []
  methodDefine.http.method = methodDefine.http.method || 'get'
  return argsChecks(ctx, argsDefine)
  .then(args=>{
    args.push(ctx)
    return Instance[method](...args)
  })
  .then(data=>{
    ctx.response.body = data
    ctx.response.status
    return next()
  })
  .catch(err=>{
    const error ={}
    error.name = err.name
    error.message = err.message
    error.stack = err.stack
    error.status = util.isNumber(err.code) ? err.code : 500
    logger.error(`method: ${method}, date: ${Date.now()}, err: ${error}`)
    ctx.response.status = error.status
    ctx.response.body = error
    return next()
  })
}

const beforeHook = hook
const afterHook = hook

/**
 * defineSwaggerParameters
 * @param {apiDefinition} apiDefinition
 * @param {[{definition}]} defineParameters define Parameters
 */
function defineSwaggerParameters(apiDefinition, defineParameters) {
  const parameters = []
  const requestBodyParameters = []
  for (const defineParameter of defineParameters) {
    const swaggerParameter = {}
    swaggerParameter.name = defineParameter.arg
    // TODO:
    // swaggerParameter.in define.
    defineParameter.source = defineParameter.source || 'url'
    if (defineParameter.source !== 'body') {
      swaggerParameter.in = defineParameter.source === 'url' ? 'query':'path'
      swaggerParameter.required = defineParameter.required || false
      swaggerParameter.description = defineParameter.description
      swaggerParameter.schema = {type: defineParameter.type}
      swaggerParameter.allowReserved = false
      parameters.push(swaggerParameter)
    }
    if (defineParameter.source === 'body') {
      swaggerParameter.in = 'body'
      requestBodyParameters.push(defineParameter)
    }
  }
  if (requestBodyParameters.length) {
    apiDefinition.requestBody = defineSwaggerRequestBody(requestBodyParameters)
  }
  apiDefinition.parameters = parameters
}
/**
 * defineSwaggerRequestBody define Swagger RequestBody
  * @param {[{definition}]} defineParameters define Parameters
 * @return {Swagger.requestBody}
 */
function defineSwaggerRequestBody(defineParameters = []) {
  const requestBody = {}
  requestBody.content = {}
  requestBody['content']['multipart/form-data'] = {
    schema: {
      type: 'object',
      properties: {},
    },
  }
  const properties = {}
  for (const defineParameter of defineParameters) {
    properties[defineParameter.arg] = {
      type: defineParameter.type,
      description: defineParameter.description,
    }
  }
  requestBody['content']['multipart/form-data']['schema']['properties'] = properties
  return requestBody
}
/**
 * define Swagger API Document
 * @param {*} app
 * @param {String} modelName
 * @param {*} definition
 * @param {String} httpPath
 * @param {String} httpMethod
 */
function defineSwaggerAPIDoc(app, modelName, definition = {}, httpPath, httpMethod) {
  if (httpPath.includes(':')) {
    httpPath = httpPath.split('/').map(_=>_.indexOf(':') === 0 ? `{${_.slice(1)}}`:_).join('/')
  }
  const apiDefinition = {}
  // define response
  const responses = {}
  definition.return = definition.return || {}
  definition.return.type = definition.return.type || 'string'
  const statusCode = definition.return.code || 200
  const type = definition.return.httpType || 'application/json'
  responses[statusCode] = {
    description: definition.return.description,
  }
  responses[statusCode]['content'] = {}
  responses[statusCode]['content'][type] = {
    schema: {
      // TODO: error array not support
      type: (definition.return.type).toLowerCase(),
    },
  }
  apiDefinition.description = definition.description
  apiDefinition.responses = responses
  apiDefinition.tags = [modelName]
  defineSwaggerParameters(apiDefinition, definition.accepts)
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
      (ctx, next)=>{
        definition[method]['name'] = `${Instance.modelName}.${method}`
        return beforeHook(ctx, definition[method], next)
      },
      (ctx, next)=>{
        return exec(ctx, Instance.model, method, definition[method], next)
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
