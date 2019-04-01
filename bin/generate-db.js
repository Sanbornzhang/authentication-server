const path = require('path')
const instance = require('../boot/01-load-instance')
const laodYaml = require('../utils/load-yaml')
const config = laodYaml(path.join(__dirname, '../config.yaml'))
const fakeApp = {context: {configOptions: config}}
instance(fakeApp)
.then((Models)=>{
  const creatDBList = []
  Object.keys(Models).forEach(modeName=>{
    creatDBList.push(Models[modeName].model.sync())
  })
  return Promise.all(creatDBList)
})
.then(_=>{
  console.log('create tables successful')
})
