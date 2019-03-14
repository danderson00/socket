const hostModule = require('../../host')
const hostFeature = require('../../host/features/log')
const consumerModule = require('../../consumer')
const consumerFeature = require('../../consumer/features/log')
const WebSocket = require('ws')

let server, hostWrite, consumerWrite

const setup = async () => {
  server = new WebSocket.Server({ port: 1234 })
  hostWrite = jest.fn()
  consumerWrite = jest.fn()
  hostModule(server, { log: { destination: { write: hostWrite }, level: 'warn' } })
    // .useFeature(hostFeature())
    .useFeature('log')

  return await consumerModule({ 
    socketFactory: () => new WebSocket('ws://localhost:1234'),
    log: { destination: { write: consumerWrite }, level: 'warn' }
  })
    // .useFeature(consumerFeature())
    .useFeature('log')
    .connect()
}

afterEach(() => server.close())

test("log entries from consumer are logged to both consumer and host log streams", async () => {
  const api = await setup()
  await api.log('warn', { p: 1 })
  await api.log('error', new Error('test error'))
  expect(consumerWrite.mock.calls.length).toBe(2)
  expect(consumerWrite.mock.calls[0][0]).toContain('p\":1')
  expect(consumerWrite.mock.calls[1][0]).toContain('test error')
  expect(hostWrite.mock.calls.length).toBe(2)
  expect(hostWrite.mock.calls[0][0]).toContain('p\":1')
  expect(hostWrite.mock.calls[1][0]).toContain('test error')
})