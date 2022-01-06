const hostModule = require('../../host')
const { unwrap } = require('@x/expressions')
const { subject } = require('@x/expressions/src/observable')
const WebSocket = require('ws')

let client, host, server, sentFromHost, connections

const openSocket = () => new Promise(resolve => {
  const socket = new WebSocket('ws://localhost:1234')
  socket.on('open', () => resolve(socket))
})

const setup = async (api, options) => {
  server = new WebSocket.Server({ port: 1234 })
  host = hostModule({ server, log: { level: 'fatal' }, ...options }).useApi({ api })
  connections = host.connections.groupBy('id')
  client = await openSocket()
  sentFromHost = jest.fn()
  client.on('message', sentFromHost)
}

const delay = delay => new Promise(r => setTimeout(r, delay))

afterEach(() => server.close())

test("static API call returns ack and result", async () => {
  await setup(() => 'world')
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' },
    commandId: 1
  }))
  await delay(10)

  expect(sentFromHost.mock.calls).toEqual([
    [JSON.stringify({ commandId: 1, status: 'ack' })],
    [JSON.stringify({
      status: 'ok',
      data: { type: 'static', value: 'world' },
      session: 'terminate',
      sessionId: 1
    })]
  ])
})

test("async static API call returns ack and result", async () => {
  await setup(() => new Promise(r => setTimeout(() => r('world'))))

  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(20)

  expect(sentFromHost.mock.calls).toEqual([
    [JSON.stringify({
      status: 'ok',
      data: { type: 'static', value: 'world' },
      session: 'terminate',
      sessionId: 1
    })]
  ])
})

test("nonexistent API function returns ack and error", async () => {
  await setup()
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(50)

  expect(sentFromHost.mock.calls).toEqual([
    [JSON.stringify({
      status: 'error',
      data: { message: "No operation 'api' on host API" },
      session: 'terminate',
      sessionId: 1
    })]
  ])
})

test("observable API call returns ack, result and updates", async () => {
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
    data: { type: 'observable', value: 'world', hasErrorObservable: true },
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

test("session reestablish returns ack and update", async () => {
  await setup(() => subject({ initialValue: 'world' }))
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'reestablish',
    type: 'operation',
    data: { operation: 'api' },
    commandId: 1
  }))
  await delay(10)

  expect(sentFromHost.mock.calls).toEqual([
    [JSON.stringify({ commandId: 1, status: 'ack' })],
    [JSON.stringify({
      status: 'update',
      data: { value: 'world' },
      sessionId: 1
    })]
  ])
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

  expect(sentFromHost.mock.calls).toEqual([
    [JSON.stringify({
      status: 'ok',
      data: { type: 'static', value: 'wor1d' },
      session: 'terminate',
      sessionId: 1
    })]
  ])
})

test("errors thrown from API functions are returned", async () => {
  await setup(() => { throw new Error('test') })
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(20)

  expect(sentFromHost.mock.calls).toEqual([
    [JSON.stringify({
      status: 'error',
      data: { message: "test" },
      session: 'terminate',
      sessionId: 1
    })]
  ])
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

  expect(sentFromHost.mock.calls).toEqual([
    [JSON.stringify({
      status: 'error',
      data: { message: "test" },
      session: 'terminate',
      sessionId: 1
    })]
  ])
})

test("connections are available on result connections observable", async () => {
  await setup(() => 'world')
  expect(connections().length).toBe(1)
})

test("sessions are available on result connections observable", async () => {
  await setup(() => subject())
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' } 
  }))
  await delay(20)
  expect(connections().length).toBe(1)
  expect(unwrap(connections)[0].sessions.length).toBe(1)
})

test("sessions are removed from sessions collection when terminated", async () => {
  await setup(() => subject())
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
  await delay(20)
  expect(connections().length).toBe(1)
  expect(unwrap(connections)[0].sessions.length).toBe(0)
})

test("sessions are throttled if option set", async () => {
  const source = subject()
  await setup(() => source, { throttle: { timeout: 20 } })
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' }
  }))
  await delay(10)
  expect(sentFromHost.mock.calls.length).toBe(1)

  source.publish(1)
  source.publish(2)
  source.publish(3)
  source.publish(4)
  source.publish(5)

  await delay(10)
  expect(sentFromHost.mock.calls.length).toBe(2)

  await delay(15)
  expect(sentFromHost.mock.calls.length).toBe(3)

  source.publish(5)
  source.publish(6)

  await delay(10)
  expect(sentFromHost.mock.calls.length).toBe(3)

  await delay(10)
  expect(sentFromHost.mock.calls.length).toBe(4)
})

test("throttling is off by default", async () => {
  const source = subject()
  await setup(() => source)
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'api' }
  }))
  await delay(10)

  source.publish(1)
  source.publish(2)
  source.publish(3)
  source.publish(4)
  source.publish(5)

  await delay(10)
  expect(sentFromHost.mock.calls.length).toBe(6)
})