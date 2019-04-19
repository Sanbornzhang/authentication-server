const path = require('path')
const instance = require('../boot/01-load-instance')
const laodYaml = require('../utils/load-yaml')
const config = laodYaml(path.join(__dirname, '../config.yaml'))
const fakeApp = {context: {configOptions: config}}
const creatTables = []
const creatRelationsTables = []
/**
 * main create table
 */
async function main() {
  Models = await instance(fakeApp)
  // TODO: 关联关系表创建不会成功！ mysql 集群中外键的性能会比较慢.
  Object.keys(Models).forEach(async modeName=>{
    if (modeName.toString().split('_').length === 1) {
      await Models[modeName].model.sync()
    } else {
      creatRelationsTables.push(Models[modeName].model)
    }
  })
  for (const model of creatRelationsTables) {
    await model.sync()
  }
  console.log('create tables successful')
}
main()
