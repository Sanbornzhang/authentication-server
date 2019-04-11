const uuid = require('uuid')
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
    console.log(filter)
    // TODO: fix findAll bug
    return Instance.findAll()
  }
  /**
   * find Instance By id
   * @param {String} id instance id
   * @return {Instance}
   */
  Instance.findById = function findById(id) {
    return Instance.findByPk(id)
  }
  Instance.created = function create(instance) {
    if (! instance.id) {
      const idArray = uuid.v1().split('-')
      instance.id = `${idArray[2]}${idArray[1]}${idArray[3]}${idArray[4]}${idArray[0]}`
    }
    return Instance.create(instance)
  }
}
module.exports = Base
