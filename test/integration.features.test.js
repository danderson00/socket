const hostModule = require('../host')
const consumerModule = require('../consumer')
const WebSocket = require('ws')

let server, lastWebsocket

const setup = async (hostFeature, consumerFeature) => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule({ server, log: { level: 'fatal' } }).useFeature(hostFeature)
  const consumer = consumerModule({ socketFactory: () => lastWebsocket = new WebSocket('ws://localhost:1234') })
  if(consumerFeature) {
    consumer.useFeature(consumerFeature)
  }
  return consumer.connect()
}

afterEach(() => server.close())

test("simple feature", async () => {
  const api = await setup(
    () => ({ name: 'test', api: { hello: () => 'world' } }),
    () => {
      return { name: 'test', initialise: () => ({
        middleware: { hello: async ({ next }, value) => `${await next(value)}!` }
      }) }
    }
  )
  const result = await api.hello()
  expect(result).toBe('world!')
})

test("feature with handshake data", async () => {
  await setup(
    () => ({ name: 'test', handshake: ({ data }) => {
      expect(data.test).toBe('testFromConsumer')
      return 'testFromHost'
    } }),
    () => ({
      name: 'test',
      handshakeData: 'testFromConsumer',
      initialise: ({ handshakeData }) => {
        expect(handshakeData.test).toBe('testFromHost')
        return {}
      }
    })
  )
})

test("feature with consumer handshake data as function", async () => {
  await setup(
    () => ({ name: 'test', handshake: ({ data }) => {
        expect(data.test).toBe('testFromConsumer')
        return 'testFromHost'
      } }),
    () => ({
      name: 'test',
      handshakeData: () => 'testFromConsumer',
      initialise: ({ handshakeData }) => {
        expect(handshakeData.test).toBe('testFromHost')
        return {}
      }
    })
  )
})

test("onConnect and onDisconnect callbacks", async () => {
  const onConnect = jest.fn()
  const onDisconnect = jest.fn()
  await setup(
    () => ({
      name: 'test',
      api: { hello: () => 'world' },
      onConnect,
      onDisconnect
    })
  )
  expect(onConnect.mock.calls.length).toBe(1)
  lastWebsocket.close()
  await new Promise(r => setTimeout(r, 10))
  expect(onDisconnect.mock.calls.length).toBe(1)
})