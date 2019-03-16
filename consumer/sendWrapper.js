module.exports = ({ send }, sessionId, direct) => {
  const wrapped = message => (direct ? send.direct : send)({ ...message, sessionId })
  wrapped.operation = (data, session = 'establish') => wrapped({ type: 'operation', session, data })
  wrapped.handshake = data => wrapped({ type: 'handshake', session: 'establish', data })
  wrapped.terminate = () => wrapped({ session: 'terminate' })
  return wrapped
}