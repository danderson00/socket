const sendWrapper = require('../sendWrapper')
const { filterObservable } = require('@x/observable')

module.exports = (socket, middleware) => {
  const nextId = (id => () => ++id)(0)
  let sessions = []

  return {
    get: () => sessions,
    create: (type, data, immediate) => {
      const id = nextId()
      const sessionMessages = filterObservable(socket.messages, x => x.sessionId === id)
      const session = {
        id,
        type,
        socket,
        messages: sessionMessages,
        disconnect: () => {
          sessions = sessions.filter(x => x.id !== id)
          sessionMessages.disconnect()
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
      //       e.g. the unify subscriptions module shares an observable,
      //       this session never gets removed from the sessions collection
      //       by having disconnect called
      sessions = [...sessions, session]
      return session
    }
  }
}