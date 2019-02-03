module.exports = (socket, sessionFactory, { serialize, deserialize }) => {
  const sessions = {}
  
  const messageHandler = data => {
    const message = deserialize(data)

    // pipe message to appropriate session
    if(sessions[message.id]) {
      sessions[message.id](message)
      if(message.session === 'terminate') {
        delete sessions[message.id]
      }
    } else {
      // send wrapper that serializes attaches the session ID property
      const send = data => socket.send(serialize({ ...data, id: message.id }))
      const terminate = () => { delete sessions[message.id] }

      if(message.session === 'establish') {
        sessions[message.id] = sessionFactory.create(message, send, terminate)
      } else {
        send({ status: 'error', data: { message: `No active session with ID ${message.id}` } })
      }
    }
  }

  socket.addEventListener('message', messageHandler)

  return {
    close: () => socket.removeEventListener('message', messageHandler)
  }
}