module.exports = (send, sessionId) => {
  const wrapped = message => send({ ...message, sessionId })
  wrapped.error = (error, session = 'terminate') => wrapped({ status: 'error', data: { message: error.message || error }, session })
  wrapped.ok = (data, session = 'terminate') => wrapped({ status: 'ok', data, session })
  wrapped.update = data => wrapped({ status: 'update', data })
  return wrapped
}