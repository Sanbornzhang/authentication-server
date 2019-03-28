const log = require('log4js')
module.exports = (app)=>{
  app.configOptions = app.configOptions || {}
  app.configOptions.log = app.configOptions.log || {}

  const level = app.configOptions.log.level || {}
  const configOptions = app.configOptions.log.options || {}
  app.context.log = log
  app.context.log.options = configOptions
  app.context.log.level = level
  return Promise.resolve()
}
