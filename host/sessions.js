const sendWrapper = require('./sendWrapper')

module.exports = ({ messages, send }, sessionFactory) => (
  messages.groupBy(
    'sessionId',
    sessionObservable => sessionObservable
      .where(x => x.session === 'establish')
      .map(() => sessionFactory.create(sessionObservable, sendWrapper(send, sessionObservable.key)))
  )
)