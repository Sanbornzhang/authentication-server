const log4j = require('log4js')

/**
 * logs
 * @param {*} app instance
 * @return {Promise}
 */
function logs(app) {
  // TODO: 验证参数的合法性 ctx.configOptions.log.options
  const logOptions = app.context.configOptions.log.options
  log4j.configure(logOptions)
  const logger = log4j.getLogger('default')
  app.context.logger = logger
  app.context.log4j = log4j
  return Promise.resolve()
}

module.exports = logs
