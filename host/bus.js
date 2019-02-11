const sendWrapper = require('./sendWrapper')

module.exports = (observable, sessionFactory) => {
  return {
    sessions: observable.groupBy(
      'sessionId',
      sessionObservable => sessionObservable.reduce(
        (session, message) => session(message),
        sessionFactory.create(sessionObservable, sendWrapper(serialize, socket, message.id))
      )
    )
  }
}