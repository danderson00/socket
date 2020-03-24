const userConfiguration = require('../../consumer/userConfiguration')

test("userConfiguration adds middleware in order when initialized", async () => {
  const middleware = { add: jest.fn() }
  const config = userConfiguration(middleware)
  config.use({ a: 1 })
  config.useFeature(() => Promise.resolve({ name: 'test1', middleware: { b: 2 } }))
  config.useFeature(() => ({ name: 'test2', middleware: { c: 3 } }))
  config.use({ d: 4 })
  await config.initialize()
  expect(middleware.add.mock.calls).toEqual([
    [{ a: 1 }],
    [{ b: 2 }],
    [{ c: 3 }],
    [{ d: 4 }]
  ])
})

test("userConfiguration passes context to feature constructor", async () => {
  const middleware = { add: jest.fn() }
  const config = userConfiguration(middleware)
  config.useFeature(context => {
    expect(context).toEqual({ a: 1 })
    return { name: 'test' }
  })
  await config.initialize({ a: 1 })
})