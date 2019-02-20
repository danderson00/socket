const hostModule = require('../../host')
const { subject } = require('xest')
const WebSocket = require('ws')

let client, server, sentFromHost

const openSocket = () => new Promise(resolve => {
  const socket = new WebSocket('ws://localhost:1234')
  socket.on('open', () => resolve(socket))
})

const setup = async api => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule(server, { api })
  client = await openSocket()
  sentFromHost = jest.fn()
  client.on('message', sentFromHost)
}

const delay = delay => new Promise(r => setTimeout(r, delay))

afterEach(() => server.close())

test("static API call returns result", async () => {
  await setup(() => 'world')
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(10)

  expect(sentFromHost.mock.calls).toEqual([[JSON.stringify({
    status: 'ok',
    data: { type: 'static', value: 'world' },
    session: 'terminate',
    sessionId: 1
  })]])
})

test("async static API call returns result", async () => {
  await setup(() => new Promise(r => setTimeout(() => r('world'))))

  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(20)

  expect(sentFromHost.mock.calls).toEqual([[JSON.stringify({
    status: 'ok',
    data: { type: 'static', value: 'world' },
    session: 'terminate',
    sessionId: 1
  })]])
})

test("nonexistent API function returns error", async () => {
  await setup()
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(10)

  expect(sentFromHost.mock.calls).toEqual([[JSON.stringify({
    status: 'error',
    data: { message: "No operation 'api' on host API" },
    session: 'terminate',
    sessionId: 1
  })]])
})

test("observable API call returns result and updates", async () => {
  const source = subject({ initialValue: 'world' })
  await setup(() => source)
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(10)

  expect(sentFromHost.mock.calls.length).toBe(1)
  expect(sentFromHost.mock.calls[0]).toEqual([JSON.stringify({
    status: 'ok',
    data: { type: 'observable', value: 'world' },
    session: 'persistent',
    sessionId: 1
  })])

  source.publish('world2')
  await delay(10)

  expect(sentFromHost.mock.calls.length).toBe(2)
  expect(sentFromHost.mock.calls[1]).toEqual([JSON.stringify({
    status: 'update',
    data: { value: 'world2' },
    sessionId: 1
  })])
})

test("sending session terminate unsubscribes from observables", async () => {
  const source = subject({ initialValue: 'world' })
  await setup(() => source)

  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'terminate'
  }))
  source.publish('world2')
  await(delay(10))

  expect(sentFromHost.mock.calls.length).toBe(1)
})

test("parameters are passed to API functions", async () => {
  await setup((p1, empty, p2) => p1.a + p1.b + p2)
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api', parameters: [{ a: 'wor', b: 1 }, undefined, 'd'] } 
  }))
  await delay(10)

  expect(sentFromHost.mock.calls).toEqual([[JSON.stringify({
    status: 'ok',
    data: { type: 'static', value: 'wor1d' },
    session: 'terminate',
    sessionId: 1
  })]])
})

test("errors thrown from API functions are returned", async () => {
  await setup(() => { throw new Error('test') })
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(10)

  expect(sentFromHost.mock.calls).toEqual([[JSON.stringify({
    status: 'error',
    data: { message: "test" },
    session: 'terminate',
    sessionId: 1
  })]])
})

test("rejected promises from API functions are returned", async () => {
  await setup(() => Promise.reject(new Error('test')))
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(10)

  expect(sentFromHost.mock.calls).toEqual([[JSON.stringify({
    status: 'error',
    data: { message: "test" },
    session: 'terminate',
    sessionId: 1
  })]])
})