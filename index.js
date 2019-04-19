
const path = require('path')
const crypto = require('crypto')
const Koa = require('koa')
const Router = require('koa-router')
const json = require('koa-json')
const formidable = require('formidable')
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
  app.context.configOptions = configOptions || {}
  app.context.configOptions.jwt = app.context.configOptions.jwt || {}
  app.context.configOptions.jwt.secretKey = app.context.configOptions.jwt.secretKey || 
                                            crypto.createHash('sha1').update(crypto.randomBytes(16)).digest('hex');
  app.context.configOptions.jwt.expireDate = app.context.configOptions.jwt.expireDate || 1000 * 60 * 60 * 24 * 7
  app.router = router

  // using middleware
  // TODO:
  //  change to middleware func
  const form = new formidable.IncomingForm();
  const parser = (req)=>{
    return new Promise((resolve, reject)=>{
      // no using files
      form.type = 'multipart'
      form.multiples = true
      form.parse(req, (err, fields, files)=>{
        if (err) return reject(err)
        return resolve(fields)
      })
      // form.on('file',(name, file)=>{
      //   // handing file logic
      // })
    })
  }
  app.use(logs)
  app.use(async (ctx, next)=>{
    ctx.body = await parser(ctx.req)
    await next()
  })
  app.use(router.routes())
  app.use(router.allowedMethods())
  app.use(json())

  // TODO:
  // handing error
  // app.use(async (ctx, next)=>{
  //   try {
  //     await next()
  //   } catch (err) {
  //     ctx.status = err.status || 500;
  //     ctx.body = err.message;
  //     ctx.app.emit('error', err, ctx)
  //   }
  // })
  // app.onerror = (err) => {
  // }
  // loading Boot scripts
  await execFile(app, path.join(__dirname, './boot'))


  app.listen(configOptions.port, _=>{
    console.log(`app listening on port ${configOptions.port}`)
  })
}

main()
module.exports = main
