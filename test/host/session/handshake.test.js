const sessionFactory = require('../../../host/session')
const sendWrapper = require('../../../host/sendWrapper')
const apiModule = require('../../../host/api')
const { subject } = require('xest')

let sentFromHost, source

const setup = initialValue => {
  const hostApi = apiModule()
  hostApi.add({ api: () => {} })
  sentFromHost = jest.fn()
  source = subject({ initialValue })
  source.disconnect = jest.fn()
  sessionFactory(hostApi).create(source, sendWrapper(sentFromHost, 1), { events: subject() })
  return new Promise(setTimeout)
}

test("handshake returns api functions", async () => {
  await setup({
    session: 'establish',
    type: 'handshake',
    data: { version: '0.0.1' } 
  })

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

