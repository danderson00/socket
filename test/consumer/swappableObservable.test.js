const swappable = require('../../consumer/swappableObservable')
const { subject, proxy } = require('xest')

test("swappable proxies supplied observable", () => {
  const source = subject()
  const s = swappable(source)
  const handler = jest.fn()
  s.subscribe(handler)
  source.publish(1)
  source.publish(2)
  expect(handler.mock.calls).toEqual([[1], [2]])
})

test("swappable switches to proxying observable passed to swap", () => {
  const source1 = subject()
  const source2 = subject()
  const s = swappable(source1)
  const handler = jest.fn()
  s.subscribe(handler)
  source1.publish(1)
  source1.publish(2)
  s.swap(source2)
  source1.publish(3)
  source2.publish(4)
  expect(handler.mock.calls).toEqual([[1], [2], [4]])
})

test("swappable passes options to observable", () => {
  const s = swappable(subject(), { initialValue: 1 })
  expect(s()).toBe(1)
})

test("swappable proxies parent disconnect", () => {
  const source = subject()
  const s = swappable(proxy(source))
  const handler = jest.fn()
  s.subscribe(handler)
  s.disconnect()
  source.publish(1)
  expect(handler.mock.calls.length).toBe(0)
})