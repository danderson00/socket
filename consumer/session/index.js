const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = () => ({
  create: (type, data, context) => sessions[type](data, context)
})