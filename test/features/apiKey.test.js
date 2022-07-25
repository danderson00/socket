const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server

const setup = ({ host, consumer } = {}) => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule({ server, log: { level: 'fatal' } })
    .useFeature('apiKey', host)
    .useApi({ hello: () => 'world' })

  return consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234'), })
    .useFeature('apiKey', consumer).connect()
}

afterEach(() => server.close())

test("apiKey passes if both are the same static value", async () => {
  const { hello } = await setup({ host: '1234', consumer: '1234' })
  expect(await hello()).toBe('world')
})

test("apiKey fails if both static values don't match", async () => {
  await expect(setup({ host: '123', consumer: '1234' }))
    .rejects.toEqual(new Error('Connection handshake failed'))
})

test("host apiKey can be validation function", async () => {
  const { hello } = await setup({ host: key => key === '1234', consumer: '1234' })
  expect(await hello()).toBe('world')
})

test("consumer apiKey can be function", async () => {
  const { hello } = await setup({ host: '1234', consumer: () => '1234' })
  expect(await hello()).toBe('world')
})

test("apiKey fails if test function returns false", async () => {
  await expect(setup({ host: () => false, consumer: '1234' }))
    .rejects.toEqual(new Error('Connection handshake failed'))
})

test("apiKey fails if test function throws", async () => {
  await expect(setup({ host: () => { throw new Error() }, consumer: '1234' }))
    .rejects.toEqual(new Error('Connection handshake failed'))
})
