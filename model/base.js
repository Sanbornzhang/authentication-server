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
  }
  /**
   * find by filter
   * @param {Object} filter
   * @return {[Instacne]} Instance Array
   */
  find(filter) {
    return this.model.findAll(filter)
  }
  /**
   * find Instance By id
   * @param {String} id instance id
   * @return {Instacne}
   */
  findById(id) {
    return this.model.findByPK(id)
  }
  /**
   * find one Instance
   * @param {*} filter
   * @return {Instacne}
   */
  findOne(filter) {
    return this.model.findOne(filter)
  }
}
module.exports = Base
