const hostModule = require('../host')
const consumerModule = require('../consumer')
const WebSocket = require('ws')

let server

const setup = async (hostFeature, consumerFeature) => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule({ server, log: { level: 'fatal' } }).useFeature(hostFeature)
  return await consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234') })
    .useFeature(consumerFeature)
    .connect()
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