const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

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
  const spy = jest.fn()
  setup({ host: '123', consumer: '1234' }).then(spy)
  await delay(10)
  expect(spy.mock.calls.length).toBe(0)
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
  const spy = jest.fn()
  setup({ host: () => false, consumer: '1234' }).then(spy)
  await delay(10)
  expect(spy.mock.calls.length).toBe(0)
})

test("apiKey fails if test function throws", async () => {
  const spy = jest.fn()
  setup({ host: () => { throw new Error() }, consumer: '1234' }).then(spy)
  await delay(10)
  expect(spy.mock.calls.length).toBe(0)
})
