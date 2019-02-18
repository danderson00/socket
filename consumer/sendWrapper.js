module.exports = (send, sessionId) => {
  const wrapped = message => send({ ...message, sessionId })
  wrapped.operation = (data, session = 'establish') => wrapped({ type: 'operation', session, data })
  wrapped.handshake = data => wrapped({ type: 'handshake', session: 'establish', data })
  wrapped.terminate = () => wrapped({ session: 'terminate' })
  return wrapped
}