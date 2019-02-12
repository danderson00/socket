const sendWrapper = require('./sendWrapper')

module.exports = ({ messages, send }, sessionFactory) => (
  messages.groupBy(
      'sessionId',
      sessionObservable => sessionObservable.reduce(
        (session, message) => session(message),
        sessionFactory.create(sessionObservable, sendWrapper(send, message.sessionId))
      )
    )
)