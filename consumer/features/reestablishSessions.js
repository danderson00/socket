const pipeline = require('../../common/pipeline')

module.exports = options => ({ middleware, sessions, log }) => {
  const reestablishSession = ({ send, data }, parameters) => (
    // operation is the only supported session type. session types will likely be refactored out anyway
    send.operation({ ...data, parameters }, 'reestablish')
  )

  return {
    connect: () => Promise.all(
      sessions.get().map(session => (
        pipeline(
          { handler: (...parameters) => reestablishSession(session, parameters) },
          middleware.get(session.data.operation),
          { ...session }
        )(...session.data.parameters)
      ))
    ).then(results => log.trace(`Reestablished ${results.length} sessions`))
  }
}