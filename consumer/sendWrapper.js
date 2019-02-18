module.exports = (send, sessionId) => {
  const wrapped = message => send({ ...message, sessionId })
  wrapped.operation = (data, session = 'establish') => send({ type: 'operation', session, data })
  wrapped.handshake = data => send({ type: 'handshake', session: 'establish', data })
  wrapped.terminate = () => send({ session: 'terminate' })
  return wrapped
}