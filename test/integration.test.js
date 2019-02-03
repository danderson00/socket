const hostModule = require('../host')
const consumerModule = require('../consumer')
const WebSocket = require('ws')

test("simple API invocation", async () => {
  const server = new WebSocket.Server({ port: 1234 })
  const host = hostModule(server, { hello: () => 'world' }, { log: { level: 'trace' } })
  const consumer = await consumerModule(new WebSocket('ws://localhost:1234'))

  const result = await consumer.hello()
  expect(result).toBe('world')

  server.close()
})