const hostModule = require('../host')
const consumerModule = require('../consumer')
const WebSocket = require('ws')

const setup = target => async () => {
  const server = new WebSocket.Server({ port: 1234 })

  try {
    const log = jest.fn()
    hostModule({ server }, { log: { level: 'info', writers: [() => log] } })

    let socket
    const consumer = await consumerModule({ socketFactory: () => socket = new WebSocket('ws://localhost:1234') })
    const connect = async () => {
      await consumer.connect()
      return socket
    }

    await target({ connect, log })
  } finally {
    server.close()
  }
}

test("connection count is logged", setup(async ({ connect, log }) => {
  const connectionCount = () => log.mock.calls[log.mock.calls.length - 1][0].connectionCount
  const socket1 = await connect()
  expect(connectionCount()).toBe(1)
  const socket2 = await connect()
  expect(connectionCount()).toBe(2)
  socket1.close()
  await new Promise(r => setTimeout(r, 10))
  expect(connectionCount()).toBe(1)
  socket2.close()
  await new Promise(r => setTimeout(r, 10))
  expect(connectionCount()).toBe(0)
}))
