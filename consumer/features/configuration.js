module.exports = callback => () => ({
  name: 'configuration',
  initialise: ({ handshakeData }) => callback(handshakeData.configuration)
})
