const crypto = require('crypto')
const util = require('util')
const jwt = require('jsonwebtoken')

/**
 * sign Jwt Token
 * @param {*} signObject
 * @param {string} signSecretKey
 * @param {Object} options sign object
 * @return {Object} {id: jwtWebToken}
 */
function signJwtToken(signObject, signSecretKey, options = {algorithm: 'RS256'}) {
  const sign = util.promisify(jwt.sign)
  return sign(signObject, signSecretKey)
  .then(token=>{
    return Promise.resolve({id: token})
  })
}
/**
 * Account Instance function
 * @param {*} Account Instance
 */
function AccountInstance(Account) {
  /**
   * encryption password
   * @param {*} password
   * @param {*} method
   * @return {String} Password
   */
  function encryptionPassword(password, method = 'md5') {
    return crypto.createHash(method).update(password).digest('hex')
  }

  Account.oldCreate = Account.create
  Account.create = (Instance, ctx)=>{
    if (!Instance.password) {
      const error = new Error()
      error.code = 400
      error.message = 'password can not be null'
      error.name = 'INVALID_PASSWORD'
      return Promise.reject(error)
    }
    Instance.password = encryptionPassword(Instance.password)
    return Account.findOne({where: {username: Instance.username}})
    .then(_=>{
      if (_) {
        const error = new Error()
        error.code = 400
        error.message = `username ${Instance.username} already exist`
        error.name = 'USER_ALREADY_EXEIST'
        return Promise.reject(error)
      }
      return Account.oldCreate(Instance)
    })
  }

  Account.login = (username, password, ctx) => {
    const logger = ctx.logger
    logger.debug(`method: Account.login, user: ${username}, date: ${Date()}`)
    return Account.findOne({where: {
      username: username,
    }})
      .then((account) => {
        if (!account) {
          const error = new Error()
          error.code = 401
          error.name = 'INVALID_USERNAME_PASSWORD'
          error.message = 'invalid username or password'
          return Promise.reject(error)
        }
        const isEqual = encryptionPassword(password) === account.password
        if (!isEqual) {
          const error = new Error()
          error.code = 401
          error.name = 'INVALID_USERNAME_PASSWORD'
          error.message = 'invalid username or password'
          return Promise.reject(error)
        }
        const signBody = {username: account.username, name: account.name, roleId: 'admin'}
        const secretKey = ctx.configOptions.jwt.secretKey
        const expireDate = ctx.configOptions.jwt.expireDate
        signBody.expireDate = Date.now() + expireDate
        return signJwtToken(signBody, secretKey)
      })
  }
}
module.exports = AccountInstance
