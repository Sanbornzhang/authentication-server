const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const loadYaml = require('../utils/load-yaml')
const env = require('process').env.NODE_ENV || 'dev'
const Base = require('../model/base')

const sequelizeOptions = {freezeTableName: true}
const folderPath = path.join(__dirname, '../model')

/**
 * generate2SequelizeDefinition
 * @param {Object} options config options
 * @return {Object} translateOptions
 */
function generate2SequelizeDefinition(options) {
  const translateOptions = {}
  Object.keys(options).forEach(key=>{
    translateOptions[key] = options[key]
    options[key].type = options[key].type || 'string'
    translateOptions[key].type = Sequelize[(options[key].type).toUpperCase()]
  })
  return translateOptions
}
/**
 * defineSwaggerAPIDocSchemas
 * @param {*} app app Instance
 * @param {*} modelName Model name
 * @param {*} modelDefinition model definition
 */
function defineSwaggerAPIDocSchemas(app, modelName, modelDefinition) {
  app.schemas = app.schemas || {}
  const schema = {}
  schema.type = 'object'
  schema.properties = {}
  const required = []
  Object.keys(modelDefinition).forEach(columnName=>{
    const column = {}
    column.type = modelDefinition[columnName]['type']
    schema.properties[columnName] = column
    if (!modelDefinition[columnName]['allowNull']) required.push(columnName)
  })
  app.schemas[modelName] = schema
}
/**
 * defineModel
 * @param {*} sequelize sequelize Instance
 * @param {*} modelName model name
 * @param {*} modelDefinition model definition
 * @param {[fileName]} defineFuncFiles define Func Files
 * @return {Instance} sequelize model
 */
function defineModel(sequelize, modelName, modelDefinition, defineFuncFiles = []) {
  const definition = generate2SequelizeDefinition(modelDefinition)
  const model = new Base(sequelize, modelName, definition, sequelizeOptions)
  getDefineFunction(defineFuncFiles, modelName.toLowerCase(), model)
  return model
}

/**
 * get Define Function
 * @param {*} defineFuncFiles define Function Files
 * @param {*} name lowerCase model name
 * @param {Instance} Model sequelize Model
 */
function getDefineFunction(defineFuncFiles = [], name, Model) {
  const defineFunctionFileName = defineFuncFiles.find(fileName=> {
    return path.basename(fileName, '.js').toLowerCase() === name
  })
  if (defineFunctionFileName) {
    const defineFunc = require(path.join(folderPath, defineFunctionFileName))
    defineFunc(Model.model)
  }
}
/**
 * get define relations
 * @param {Array} relations
 * @param {String} modelName model Name
 * @param {*} defineRelations define relations
 */
function getRelations(relations, modelName, defineRelations = []) {
  if (defineRelations.length) {
    for (const defineRelation of defineRelations) {
      const relation = defineRelation
      relation.currentModel = relation.model
      relation.model = modelName
      relations.push(relation)
    }
  }
}
/**
 * define relations
 * @param {*} relations Model relations
 * @param {*} Models sequelize models Instance
 */
function defineRelations(relations, Models) {
  for (const relation of relations) {
    const model = Models[relation.model]['model']
    const currentModel = Models[relation.currentModel]['model']
    if (relation.type === 'belongsToMany') {
      const throughModel = Models[relation.through]['model']
      // TODO: test through as String
      // model.belongsToMany(currentModel, {through: relation.through})
      model.belongsToMany(currentModel, {through: throughModel})
    } else {
      model[relation.type](currentModel)
    }
  }
}
/**
 * generate Models from model folder
 * @param {Object} app Koa Instance
 * @param {Object} sequelize database config options
 * @return {[ModelInstance]} model instance array
 */
function generateModels(app, sequelize) {
  const relations = []
  const fileList = fs.readdirSync(folderPath)
  // load define yaml
  const defineYAML = fileList.filter(filename => filename!=='base.yaml' && path.extname(filename) === '.yaml')
  const defineList = defineYAML.map(filename => {
    const filePath = path.join(folderPath, filename)
    return loadYaml(filePath)
  })
  // filter js file
  const defineFuncFiles = fileList.filter(filename => filename !== 'base.js' && path.extname(filename) === '.js')
  const Models = {}
  // define sequelize model
  for ( const modelDefinition of defineList) {
    defineSwaggerAPIDocSchemas(app, modelDefinition.name, modelDefinition.properties)
    Models[modelDefinition.name] = defineModel(sequelize, modelDefinition.name,
                                               modelDefinition.properties, defineFuncFiles)
    getRelations(relations, modelDefinition.name, modelDefinition.relations)
  }
  defineRelations(relations, Models)
  return Models
}
module.exports = (app)=>{
  const dbConfigOptions = app.context.configOptions.db[env]
  const sequelize = new Sequelize(dbConfigOptions.database, dbConfigOptions.username,
                                  dbConfigOptions.password, dbConfigOptions)
  const Models = generateModels(app, sequelize)
  app.context.Models = Models
  app.context.sequelize = sequelize
  return Promise.resolve(Models)
}
