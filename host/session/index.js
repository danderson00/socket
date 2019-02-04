const { proxy } = require('xest')
const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = (observable, hostApi, responseTypes) => ({
  create: (send, onTerminate) => {
    if(sessions[message.type]) {
      const id = message.id
      const sessionObservable = proxy(observable).where(x => x.id === id)
      const terminate = () => {
        sessionObservable.disconnect()
        onTerminate()
      }
      const context = {
        id,
        send,
        terminate,
        hostApi,
        responseTypes
      }
      try {
        return Promise.resolve(sessions[message.type](sessionObservable, context))
          .catch(error => {
            send.error(error)
            terminate()
          })
      } catch({ message }) {
        send.error(message)
        terminate()
      }
    } else {
      send.error(`No session type '${message.type}'`)
      terminate()
    }
  }
})