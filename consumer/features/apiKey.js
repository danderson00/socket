module.exports = apiKey => () => ({
  name: 'apiKey',
  handshakeData: apiKey,
})