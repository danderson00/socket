module.exports = options => ({ sessions, log }) => {
  const reestablishSession = ({ id, send, request }) => {
    if(request) {
      log.debug(`Reestablishing session ${id} - ${request.operation}`)
      // operation is the only supported session type. session types will likely be refactored out anyway
      return send.operation(request, 'reestablish')
    }
  }

  return {
    connect: () => Promise.all(sessions.get().map(reestablishSession))
  }
}