module.exports = (socket, hostApi, options) => {
  return new Promise((resolve, reject) => {
    socket.addEventListener('message', initiateHandshake)

    function initiateHandshake(data) {
      try {
        const request = JSON.parse(data)
        const validationMessage = requestValidationMessage(request)
        
        if(validationMessage) {
          socket.send(JSON.stringify({
            status: "error",
            data: { message: validationMessage }
          }))
          reject(new Error(validationMessage))

        } else {
          socket.send(JSON.stringify({
            status: "ok",
            operations: Object.keys(hostApi).map(name => ({ name }))
          }))
          resolve()
        }
      } catch(error) {
        socket.send(JSON.stringify({
          status: "error",
          data: { message: `Request was not JSON: ${data}` }
        }))
        reject(new Error(`Request was not JSON: ${data}`))
      } finally {
        socket.removeEventListener('message', initiateHandshake)
      }
    }

    const requestValidationMessage = request => request && 
      (request.version !== '0.0.1' && "Incorrect version")
  })
}