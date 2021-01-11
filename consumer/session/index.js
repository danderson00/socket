const sessionsModule = require('./sessions')

const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = (options, socket, middleware, log) => {
  const sessionFactory = sessionsModule(socket, middleware, options)

  return {
    get: sessionFactory.get,
    create: (type, data, immediate) => {
      return sessions[type](sessionFactory.create(type, data, immediate), log)
    }
  }
}
