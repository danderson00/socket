const busModule = require('../../host/bus')

let receiveFromConsumer
let sentFromHost
let messageHandlers
let terminateLastSession

beforeEach(() => {
  sentFromHost = jest.fn()
  const socket = {
    send: sentFromHost,
    addEventListener: (type, listener) => receiveFromConsumer = listener
  }
  messageHandlers = []
  const sessionFactory = {
    create: (message, send, terminate) => {
      terminateLastSession = terminate
      sendFromLastSession = send
      const messageHandler = jest.fn()
      messageHandlers.push(messageHandler)
      return { messageHandler }
    }
  }
  const serializer = { serialize: x => x, deserialize: x => x }

  busModule(socket, sessionFactory, serializer)
})

test("bus routes messages to appropriate session", () => {
  receiveFromConsumer({ id: 1, session: 'establish' })
  receiveFromConsumer({ id: 2, session: 'establish' })
  receiveFromConsumer({ id: 1 })

  expect(messageHandlers[0].mock.calls.length).toBe(1)
  expect(messageHandlers[0].mock.calls[0][0]).toEqual({ id: 1 })
  expect(messageHandlers[1].mock.calls.length).toBe(0)
})

test("bus removes session on terminate message", () => {
  receiveFromConsumer({ id: 1, session: 'establish' })
  receiveFromConsumer({ id: 1, session: 'terminate' })
  receiveFromConsumer({ id: 1 })
  expect(messageHandlers[0].mock.calls.length).toBe(1) // this will be the terminate message
  expect(sentFromHost.mock.calls.length).toBe(1)
  expect(sentFromHost.mock.calls[0][0].status).toBe('error')
})

test("bus removes session when terminate called", () => {
  receiveFromConsumer({ id: 1, session: 'establish' })
  terminateLastSession()
  receiveFromConsumer({ id: 1 })
  expect(messageHandlers[0].mock.calls.length).toBe(0)
  expect(sentFromHost.mock.calls.length).toBe(1)
  expect(sentFromHost.mock.calls[0][0].status).toBe('error')
})

test("bus attaches session id to sent messages", () => {
  receiveFromConsumer({ id: 1, session: 'establish' })
  sendFromLastSession({ status: 'test' })
  expect(sentFromHost.mock.calls.length).toBe(1)
  expect(sentFromHost.mock.calls[0][0]).toEqual({ id: 1, status: 'test' })
})