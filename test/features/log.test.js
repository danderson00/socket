const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server, hostWrite, consumerWrite

const setup = async () => {
  server = new WebSocket.Server({ port: 1234 })
  hostWrite = jest.fn()
  consumerWrite = jest.fn()
  hostModule({ server }, { log: { writers: [() => hostWrite], level: 'warn' } })
    .useFeature('log')

  return await consumerModule({ 
    socketFactory: () => new WebSocket('ws://localhost:1234'),
    log: { writers: [() => consumerWrite], level: 'warn' }
  })
    .useFeature('log')
    .connect()
}

afterEach(() => server.close())

test("log entries from consumer are logged to both consumer and host log streams", async () => {
  const api = await setup()
  await api.log('warn', { p: 1 })
  await api.log('error', new Error('test error'))
  expect(consumerWrite.mock.calls.length).toBe(2)
  expect(consumerWrite.mock.calls[0][0]).toEqual({ level: 2, p: 1, source: 'socket.consumer', origin: 'consumer' })
  expect(consumerWrite.mock.calls[1][0]).toMatchObject({ level: 1, message: 'test error', source: 'socket.consumer' })
  expect(hostWrite.mock.calls.length).toBe(2)
  expect(hostWrite.mock.calls[0][0]).toEqual({ level: 2, p: 1, source: 'socket.consumer', origin: 'consumer' })
  expect(hostWrite.mock.calls[1][0]).toMatchObject({ level: 1, message: 'test error', source: 'socket.consumer' })
})