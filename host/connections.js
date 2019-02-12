const xest = require('xest')
const sessions = require('./bus')

module.exports = (server, sessionFactory, { serialize, deserialize }, log) => (
  xest.fromEmitter(server, 'connection')
    .map(socket => ({ 
      connectionId: uuid(), 
      messages: xest.fromEmitter(socket, 'message').map(deserialize),
      events: xest.fromEmitter(socket, 'error', 'close'),
      send: message => socket.send(serialize(message))
    }))
    .groupBy(
      'connectionId',
      o => o.map(connection => ({
        ...connection,
        sessions: sessions(connection, sessionFactory)
      })
    )
  )
)