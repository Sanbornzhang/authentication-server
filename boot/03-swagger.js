const koaSwagger = require('koa2-swagger-ui');

/**
 * use Koa Swagger
 * @param {*} app
 */
function useKoaSwagger(app) {
  const swaggerOptions = {
    title: 'API Document',
    routerPrefix: '/docs',
    hideTopbar: true,
    swaggerOptions: {
      url: 'http://127.0.0.1:3000/swagger_define', // example path to json
    },
  }
  app.use(
    koaSwagger(swaggerOptions)
  )
}
/**
 * generalDocAPI
 * @param {*} app
 */
function generalDocAPI(app) {
  const configJson = {}
  configJson.openapi = '3.0.0'
  configJson.info = {
    title: 'authentication API Document',
    description: 'simple authentication api server',
    version: '0.0.1',
  }
  configJson.servers = [
    {
      url: 'http://127.0.0.1:3000',
      description: 'Main Server',
    },
  ]
  configJson.paths = app.paths
  configJson.components = {}
  configJson.components.schemas = app.schemas || {}
  const router = app.router
  router.get('/swagger_define', (ctx, next)=>{
    ctx.body = configJson
  })
}
module.exports = (app)=>{
  useKoaSwagger(app)
  generalDocAPI(app)
  return Promise.resolve()
}
