const sessionFactory = require('../../../host/session')
const sendWrapper = require('../../../host/sendWrapper')
const apiModule = require('../../../host/api')
const loggerModule = require('../../../common/logger')
const { subject } = require('@x/observable')

const setup = (callback, handshakeData) => {
  const hostApi = apiModule()
  hostApi.add({ api: () => {} })
  const sentFromHost = jest.fn()
  const disconnect = jest.fn()
  const source = subject({ initialValue: {
    session: 'establish',
    type: 'handshake',
    data: { version: '0.0.1', ...handshakeData }
  } })
  source.disconnect = jest.fn()
  const log = loggerModule({ level: 0 })
  const sessions = sessionFactory(hostApi, log)
  const connection = { events: subject(), log, disconnect, disconnectTimeout: { cancel: () => {} } }
  sessions.addHandshake('test', callback)
  sessions.create(source, sendWrapper(sentFromHost, 1), connection)
  return { sentFromHost, source, disconnect }
}

test("handshake returns api functions", async () => {
  const { sentFromHost, source } = setup()

  expect(sentFromHost.mock.calls).toEqual([[{
    sessionId: 1,
    session: 'terminate',
    status: 'ok',
    data: { operations: [
      { name: 'api' }
    ] }
  }]])
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("handshake returns callback data", async () => {
  const { sentFromHost } = setup(() => 'test')

  expect(sentFromHost.mock.calls).toEqual([[{
    sessionId: 1,
    session: 'terminate',
    status: 'ok',
    data: {
      operations: [
        { name: 'api' }
      ],
      test: 'test'
    }
  }]])
})

test("handshake callback is passed data and context", async () => {
  const spy = jest.fn()
  setup(spy)
  expect(spy.mock.calls.length).toBe(1)
  expect(spy.mock.calls[0][0]).toEqual({ version: '0.0.1' })
  expect(spy.mock.calls[0][1]).toHaveProperty('send')
  expect(spy.mock.calls[0][1]).toHaveProperty('hostApi')
  expect(spy.mock.calls[0][1]).toHaveProperty('log')
})

test("invalid handshake causes disconnect", async () => {
  const { sentFromHost, disconnect } = setup(undefined, { version: '0.0.20' })
  expect(sentFromHost.mock.calls.length).toBe(0)
  expect(disconnect.mock.calls.length).toBe(1)
})

test("socket is disconnected if handshake callback throws", async () => {
  const { sentFromHost, disconnect } = setup(() => {
    throw new Error('bad')
  })
  expect(sentFromHost.mock.calls.length).toBe(0)
  expect(disconnect.mock.calls.length).toBe(1)
})