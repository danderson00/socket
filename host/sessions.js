const sendWrapper = require('./sendWrapper')

module.exports = (connection, sessionFactory) => (
  connection.messages.groupBy(
    'sessionId',
    sessionObservable => sessionObservable
      .where(x => x.session === 'establish')
      .map(() => sessionFactory.create(sessionObservable, sendWrapper(connection.send, sessionObservable.key), connection))
  )
)