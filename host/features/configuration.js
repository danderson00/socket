module.exports = configuration => {
  return () => ({
    name: 'configuration',
    handshake: () => configuration
  })
}
