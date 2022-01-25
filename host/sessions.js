const sendWrapper = require('./sendWrapper')

module.exports = (connection, sessionFactory) => (
  connection.messages.groupBy(
    'sessionId',
    sessionObservable => sessionObservable.map(({ session }) => {
      if(session === 'establish' || session === 'reestablish') {
        sessionFactory.create(
          sessionObservable,
          sendWrapper(connection.send, sessionObservable.key),
          connection
        )
      }
    })
  )
)