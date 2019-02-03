const nextId = (id => () => ++id)(0)
const sessions = {
  operation: require('./operation'),
  handshake: require('./handshake')
}

module.exports = socket => ({
  create: (type, data) => {
    return sessions[type](data)
  }
})