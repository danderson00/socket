const sendWrapper = require('../sendWrapper')
const { proxy } = require('@x/expressions')

module.exports = (socket, middleware, options) => {
  const nextId = (id => () => ++id)(0)
  let sessions = []

  return {
    get: () => sessions,
    create: (type, data, immediate) => {
      const id = nextId()
      const session = {
        id,
        type,
        messages: proxy(socket.messages.where(x => x.sessionId === id)), // a tiny little leak here - the where component stays subscribed after the proxy is disconnected
        disconnect: () => {
          sessions = sessions.filter(x => x.id !== id)
          session.messages.disconnect()
        },
        terminate: () => {
          session.send.terminate()
          session.disconnect()
        },
        data, 
        send: sendWrapper(socket, id, immediate),
        middleware
      }
      // TODO: there is a memory leak here - if the operation never actually executes
      //       e.g. the xest subscriptions module shares an observable,
      //       this session never gets removed from the sessions collection
      //       by having disconnect called
      sessions = [...sessions, session]
      return session
    }
  }
}