const sendWrapper = require('./sendWrapper')
const groupedObservable = require('./utilities/groupedObservable')

module.exports = (connection, sessionFactory) => (
  groupedObservable(
    connection.messages,
    'sessionId',
    sessionObservable => sessionObservable.subscribe(({ session }) => {
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