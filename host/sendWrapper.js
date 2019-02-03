module.exports = (serialize, socket, id) => {
  const send = data => socket.send(serialize({ ...data, id }))
  send.error = (error, session = 'terminate') => send({ status: 'error', data: { message: error.message || error }, session })
  send.ok = (data, session = 'terminate') => send({ status: 'ok', data, session })
  send.update = data => send({ status: 'update', data })
  return send
}