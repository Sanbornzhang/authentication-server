const log = require('log4js')
// no using
module.exports = (app)=>{
  app.log = log
  return Promise.resolve()
}
