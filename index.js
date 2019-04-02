
const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const json = require('koa-json')
// const swagger = require('swagger-ui')

const readYaml = require('./utils/load-yaml')
const execFile = require('./utils/load-boot')

const logs = require('./middleware/logs')
const app = new Koa()
const router = new Router()

/**
 * main func
 */
async function main() {
  const configOptions = readYaml(path.join(__dirname, 'config.yaml'))
  // TODO:
  // config option validate
  app.context.configOptions = configOptions
  app.router = router

  // using middleware
  // TODO:
  //  change to middleware func
  app.use(logs)
  app.use(router.routes())
  app.use(router.allowedMethods())
  app.use(json())

  // loading Boot scripts
  await execFile(app, path.join(__dirname, './boot'))


  app.listen(configOptions.port, _=>{
    console.log(`app listening on port ${configOptions.port}`)
  })
}

main()
module.exports = main
