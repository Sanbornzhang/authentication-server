
const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')

const readYaml = require('./util/loadYaml')
const execFile = require('./util/load-boot')
const app = new Koa()
const router = new Router()

/**
 * main func
 */
async function main() {
  const configOptions = readYaml(path.join(__dirname, 'config.yaml'))

  app.configOptions = configOptions
  // TODO:
  // config option validate

  // loading Boot scripts
  await execFile(app, path.join(__dirname, './boot'))
  // using middleware
  app.use(async (ctx, next)=>{
    const logger = ctx.log.getLogger()
    logger.level = ctx.log.level
    ctx.log.configure(ctx.log.options)
    logger.info('this is debug')
    logger.error('this is debug')
    await next()
  })
  app.use(router.routes())
  app.use(router.allowedMethods())
  app.listen(configOptions.port, _=>{
    console.log(`app listening on port ${configOptions.port}`)
  })
}

main()
