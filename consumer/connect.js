module.exports = sessionFactory => {
  return sessionFactory.create('handshake')
    .then(({ status, data }) => {
      if(status === 'ok') {
        const executeOperation = operation => (...parameters) => 
          sessionFactory.create('operation', { operation, parameters })

        return data.operations.reduce(
          (api, operation) => ({ ...api, [operation.name]: executeOperation(operation.name) }),
          {}
        )
        
      } else {
        throw new Error(`Failed to handshake: ${data.message}`)
      }
    })
}
