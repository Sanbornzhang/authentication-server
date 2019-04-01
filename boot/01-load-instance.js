const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const loadYaml = require('../utils/load-yaml')
const env = require('process').env.NODE_ENV || 'dev'
const Base = require('../model/base')

const sequelizeOptions = {freezeTableName: true}
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
 * generate Models from model folder
 * @param {Object} sequelize database config options
 * @return {[ModelInstance]} model instance array
 */
function generateModels(sequelize) {
  const folderPath = path.join(__dirname, '../model')
  const fileList = fs.readdirSync(folderPath)
  const defineYAML = fileList.filter(filename => path.extname(filename) === '.yaml')
  const defineList = defineYAML.map(filename => {
    const filePath = path.join(folderPath, filename)
    return loadYaml(filePath)
  })
  const defineFuncFiles = fileList.filter(filename => filename !== 'base.js' && path.extname(filename) === '.js')
  const Models = {}
  for ( const modelDefinition of defineList) {
    const defineOption = generate2SequelizeDefinition(modelDefinition.properties)
    Models[modelDefinition.name] = new Base(sequelize, modelDefinition.name,
                                            defineOption, sequelizeOptions)
    const defineFunctionFileName = defineFuncFiles.find(fileName=> {
      return path.basename(fileName, '.js').toLowerCase() === modelDefinition.name.toLowerCase()
    })
    if (defineFunctionFileName) {
      const defineFunc = require(path.join(folderPath, defineFunctionFileName))
      defineFunc(modelDefinition.name)
    }
  }
  return Models
}
module.exports = (app)=>{
  const dbConfigOptions = app.context.configOptions.db[env]
  const sequelize = new Sequelize(dbConfigOptions.database, dbConfigOptions.username,
                                  dbConfigOptions.password, dbConfigOptions)
  const Models = generateModels(sequelize)
  app.context.Models = Models
  return Promise.resolve(Models)
}
