const crypto = require('crypto')
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
  Account.create = (Instance)=>{
    console.log(Instance)
    if (!Instance.password) {
      const error = new Error()
      error.code = 400
      error.message = 'password can not be null'
      error.name = 'INVALID_PASSWORD'
      return Promise.reject(error)
    }
    Instance.password = encryptionPassword(Instance.password)
    return Account.oldCreate(Instance)
  }
  Account.login = (username, password) => {
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
        if (isEqual) {
          return Promise.resolve()
        } else {
          const error = new Error()
          error.code = 401
          error.name = 'INVALID_USERNAME_PASSWORD'
          error.message = 'invalid username or password'
          return Promise.reject(error)
        }
      })
  }
}
module.exports = AccountInstance
