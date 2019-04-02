/**
 * base class func
 */
class Base {
  /**
   * constructor
   * @param {sequelize} sequelize
   * @param {String} modelName model name
   * @param {Object} modelSchema modelSchema definition
   * @param {Object} options sequelize options
   */
  constructor(sequelize, modelName, modelSchema, options) {
    this.modelName = modelName
    this.defineOptions = modelSchema
    this.model = sequelize.define(modelName, modelSchema, options)
    modelFuncDefine(this.model)
  }
}
/**
 * definition Model Function
 * @param {*} Instance
 */
function modelFuncDefine(Instance) {
  /**
   * find by filter
   * @param {Object} filter
   * @return {[Instance]} Instance Array
   */
  Instance.find = function find(filter) {
    return Instance.findAll({})
    .then(_=>{
      return
    })
  }
  /**
   * find Instance By id
   * @param {String} id instance id
   * @return {Instance}
   */
  Instance.findById = function findById(id) {
    return Instance.findByPK(id)
  }
}
module.exports = Base
