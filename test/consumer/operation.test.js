const operation = require('../../consumer/session/operation')
const { subject, isObservable } = require('xest')

const middleware = { get: () => [] }

test("static operations resolve and disconnect from observable", async () => {
  const source = subject()
  source.disconnect = jest.fn()
  const sentFromConsumer = jest.fn()

  const promise = operation(source, { operation: 'hello', parameters: ['world'] }, { operation: sentFromConsumer }, middleware)
  await new Promise(setTimeout)
  expect(sentFromConsumer.mock.calls).toEqual([[{ operation: 'hello', parameters: ['world'] }]])

  source.publish({
    session: 'terminate',
    status: 'ok',
    data: { type: 'static', value: 'test' }
  })
  await expect(promise).resolves.toBe('test')

  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("observable operations resolve to observable", async () => {
  const source = subject()
  source.disconnect = jest.fn()
  const terminateFromConsumer = jest.fn()

  const promise = operation(source, { operation: 'hello', parameters: ['world'] }, { operation: () => {}, terminate: terminateFromConsumer }, middleware)
  await new Promise(setTimeout)

  source.publish({
    session: 'persistent',
    status: 'ok',
    data: { type: 'observable', value: 'test' }
  })
  const o = await promise

  expect(isObservable(o)).toBe(true)
  expect(o()).toBe('test')

  source.publish({
    status: 'update',
    data: { value: 'test2' }
  })
  expect(o()).toBe('test2')

  o.disconnect()
  expect(terminateFromConsumer.mock.calls.length).toBe(1)
})