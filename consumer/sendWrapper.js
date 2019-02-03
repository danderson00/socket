module.exports = (serialize, socket, id) => {
  const send = data => socket.send(serialize({ ...data, id }))
  send.operation = (data, session = 'establish') => send({ type: 'operation', session, data })
  send.handshake = data => send({ type: 'handshake', session: 'establish', data })
  send.terminate = () => send({ session: 'terminate' })
  return send
}