
const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const json = require('koa-json')

const readYaml = require('./utils/loadYaml')
const execFile = require('./utils/load-boot')

const logs = require('./middleware/logs')
const app = new Koa()
const router = new Router()

/**
 * main func
 */
async function main() {
  const configOptions = readYaml(path.join(__dirname, 'config.yaml'))

  app.context.configOptions = configOptions
  // TODO:
  // config option validate

  // loading Boot scripts
  await execFile(app, path.join(__dirname, './boot'))
  // using middleware
  // TODO:
  //  change to middleware func
  app.use(logs)
  app.use(router.routes())
  app.use(router.allowedMethods())
  app.use(json())

  app.listen(configOptions.port, _=>{
    console.log(`app listening on port ${configOptions.port}`)
  })
  router.get('/', (ctx, next) => {
    ctx.body = {d: 1}
    next()
  });
}

main()
