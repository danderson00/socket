const sessionsModule = require('./sessions')

const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = (socket, middleware, log) => {
  const sessionFactory = sessionsModule(socket, middleware)

  return {
    get: sessionFactory.get,
    create: (type, data, immediate) => {
      return sessions[type](sessionFactory.create(type, data, immediate), log)
    }
  }
}
