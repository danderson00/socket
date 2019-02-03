module.exports = socket => {
  const handleResponse = message => {
    
  }

  socket.addMessageHandler(handleResponse)
  socket.send({ version: '0.0.1' })
}