const pipeline = require('./pipeline')

module.exports = (api, middleware) => ({
  operations: api.operations,
  execute: (name, parameters) => pipeline(api.get(name), middleware.get(name)).apply(null, parameters)
})