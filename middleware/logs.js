const process = require('process')
/**
 * log middleware
 * @param {*} ctx koa ctx
 * @param {*} next koa next
 */
async function logs(ctx, next) {
  // TODO: 验证参数的合法性 ctx.configOptions.log.options
  const logger = ctx.logger
  const starTimer = process.hrtime()
  await next()
  const duration = process.hrtime(starTimer)
  const ms = duration[0] * 1000 + duration[1] / 1e6
  if (ctx.response && ctx.response.status < 400) {
    logger.info(
      // eslint-disable-next-line max-len
      `method: ${ctx.request.method},router: ${ctx.request.url},status: ${ctx.response.status},response time: ${ms} ms`)
  } else {
    logger.error(
      // eslint-disable-next-line max-len
      `method: ${ctx.request.method},router: ${ctx.request.url},status: ${ctx.response.status},message: ${ctx.response.message}`
    )
  }
}
module.exports = logs
