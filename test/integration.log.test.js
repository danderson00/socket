const hostModule = require('../host')
const consumerModule = require('../consumer')
const { subject } = require('@x/observable')
const WebSocket = require('ws')

const delay = ms => new Promise(r => setTimeout(r, ms))

const setup = target => async () => {
  const server = new WebSocket.Server({ port: 1234 })

  try {
    const log = jest.fn()
    hostModule({ server }, { log: { level: 'info', writers: [() => log] } })
      .useApi({
        hello: () => new Promise(r => setTimeout(() => r('world'), 10)),
        observableHello:  () => new Promise(r => setTimeout(() => r(subject({ initialValue: 'world' })), 10))
      })

    let socket
    const consumer = await consumerModule({ socketFactory: () => socket = new WebSocket('ws://localhost:1234') })
    const connect = async () => {
      const api = await consumer.connect()
      return { socket, api }
    }

    await target({ connect, log, lastLog: () => log.mock.calls[log.mock.calls.length - 1][0] })
  } finally {
    server.close()
  }
}

test("connection count is logged", setup(async ({ connect, lastLog }) => {
  const { socket: socket1 } = await connect()
  expect(Object.keys(lastLog())).toEqual(['timestamp', 'origin', 'source', 'connectionId', 'level', 'message', 'connectionCount'])
  expect(lastLog().connectionCount).toBe(1)
  const { socket: socket2 } = await connect()
  expect(lastLog().connectionCount).toBe(2)
  socket1.close()
  await delay(10)
  expect(Object.keys(lastLog())).toEqual(['timestamp', 'origin', 'source', 'connectionId', 'level', 'message', 'connectionCount'])
  expect(lastLog().connectionCount).toBe(1)
  socket2.close()
  await delay(10)
  expect(lastLog().connectionCount).toBe(0)
}))

test("static calls log session establish and terminate", setup(async ({ connect, lastLog }) => {
  const { api } = await connect()
  const promise = api.hello()
  await delay()
  const establish = lastLog()
  expect(Object.keys(establish)).toEqual(['timestamp', 'origin', 'source', 'connectionId', 'sessionId', 'operation', 'level', 'message', 'reestablish'])
  expect(establish).toMatchObject({ operation: 'hello', message: 'Session established' })

  await promise
  const terminate = lastLog()
  expect(terminate).toMatchObject({ operation: 'hello', message: 'Session terminated', sessionId: establish.sessionId, connectionId: establish.connectionId })
}))

test("observable calls log session establish and terminate", setup(async ({ connect, lastLog }) => {
  const { api } = await connect()
  const promise = api.observableHello()
  await delay()
  const establish = lastLog()
  expect(Object.keys(establish)).toEqual(['timestamp', 'origin', 'source', 'connectionId', 'sessionId', 'operation', 'level', 'message', 'reestablish'])
  expect(establish).toMatchObject({ operation: 'observableHello', message: 'Session established' })

  const observable = await promise
  expect(lastLog()).toBe(establish)
  observable.disconnect()
  await delay()

  const terminate = lastLog()
  expect(terminate).toMatchObject({ operation: 'observableHello', message: 'Session terminated', sessionId: establish.sessionId, connectionId: establish.connectionId })
}))
