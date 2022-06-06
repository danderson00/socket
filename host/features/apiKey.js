module.exports = apiKey => {
  return () => ({
    name: 'apiKey',
    handshake: ({ data }, context) => {
      const valid = typeof apiKey === 'function' ? apiKey(data.apiKey) : data.apiKey === apiKey
      if(!valid) {
        throw new Error('Invalid API key')
      }
      context.connection.apiKey = data.apiKey
    }
  })
}
