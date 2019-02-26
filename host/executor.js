const pipeline = require('./pipeline')

module.exports = (api, middleware) => ({
  operations: api.operations,
  execute: (name, parameters, context) => (
    pipeline(
      api.get(name), 
      middleware.get(name),
      context
    ).apply(null, parameters)
  )
})