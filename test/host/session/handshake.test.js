const sessionFactory = require('../../../host/session')
const sendWrapper = require('../../../host/sendWrapper')
const apiModule = require('../../../host/api')
const loggerModule = require('../../../common/logger')
const { subject } = require('@x/expressions')

let sentFromHost, source

const setup = callback => {
  const hostApi = apiModule()
  hostApi.add({ api: () => {} })
  sentFromHost = jest.fn()
  source = subject({ initialValue: {
    session: 'establish',
    type: 'handshake',
    data: { version: '0.0.1' }
  } })
  source.disconnect = jest.fn()
  const log = loggerModule({ level: 'trace' })
  const sessions = sessionFactory(hostApi, log)
  sessions.addHandshake('test', callback)
  sessions.create(source, sendWrapper(sentFromHost, 1), { events: subject(), log })
  return new Promise(setTimeout)
}

test("handshake returns api functions", async () => {
  await setup()

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
  await setup(() => 'test')

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
  await setup(spy)
  expect(spy.mock.calls.length).toBe(1)
  expect(spy.mock.calls[0][0]).toEqual({ version: '0.0.1' })
  expect(spy.mock.calls[0][1]).toHaveProperty('send')
  expect(spy.mock.calls[0][1]).toHaveProperty('hostApi')
  expect(spy.mock.calls[0][1]).toHaveProperty('log')
})
