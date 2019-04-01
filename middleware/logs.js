const log4j = require('log4js')
const process = require('process')
/**
 * log middleware
 * @param {*} ctx koa ctx
 * @param {*} next koa next
 */
async function logs(ctx, next) {
  // TODO: 验证参数的合法性 ctx.configOptions.log.options
  log4j.configure(ctx.configOptions.log.options)
  const logger = log4j.getLogger('default')
  ctx.log = logger
  const starTimer = process.hrtime()
  await next()
  const duration = process.hrtime(starTimer)
  const ms = duration[0] * 1000 + duration[1] / 1e6
  if (ctx.response && ctx.response.status < 400) {
    logger.info(`method: ${ctx.request.method}, 
                router: ${ctx.request.url}, 
                status: ${ctx.response.status}, 
                response time: ${ms} ms`)
  }
  else {
    logger.error(
      `method: ${ctx.request.method}, 
                router: ${ctx.request.url}, 
                status: ${ctx.response.status}, 
                message: ${ctx.response.message}
                response time: ${ms} ms`
    )
  }

}
module.exports = logs
