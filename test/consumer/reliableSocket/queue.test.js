const queue = require('../../../consumer/reliableSocket/queue')

test("adding to queue with socket and messages immediately attempts to execute trySend", () => {
  const trySend = jest.fn(() => Promise.resolve())
  queue().add({ trySend }, true, true)
  expect(trySend.mock.calls.length).toBe(1)
})

test("commands are queued while rejecting", () => {
  const trySend = jest.fn(() => Promise.reject())
  const q = queue()
  q.add({ trySend })
  q.add({ trySend })
  expect(q.length()).toBe(2)
})

test("commands are flushed by calling flush", async () => {
  let resolve = false
  const trySend = jest.fn(() => resolve ? Promise.resolve() : Promise.reject())
  const q = queue()
  q.add({ trySend }, true, true)
  q.add({ trySend }, true, true)
  resolve = true
  await q.flush()
  expect(trySend.mock.calls.length).toBe(4)
  expect(q.length()).toBe(0)
})

test("commands are reexecuted in order after failures", async () => {
  let resolve = false
  const send = jest.fn(() => resolve ? Promise.resolve() : Promise.reject())
  const q = queue()
  q.add({ trySend: () => send(1) }, true, true)
  q.add({ trySend: () => send(2) }, true, true)
  resolve = true
  await q.flush()
  expect(send.mock.calls).toEqual([[1], [1], [1], [2]])
  expect(q.length()).toBe(0)
})