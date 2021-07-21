const userConfiguration = require('../../consumer/userConfiguration')

test("userConfiguration adds middleware in order when initialized", async () => {
  const middleware = { add: jest.fn() }
  const config = userConfiguration(middleware)
  config.use({ a: 1 })
  config.useFeature(() => Promise.resolve({
    name: 'test1', initialise: () => ({ middleware: { b: 2 } })
  }))
  config.useFeature(() => ({
    name: 'test2', initialise: () => ({ middleware: { c: 3 } })
  }))
  config.use({ d: 4 })
  await config.construct()
  await config.initialise()
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
  await config.construct({ a: 1 })
})

test("userConfiguration passes context to feature initialiser", async () => {
  const middleware = { add: jest.fn() }
  const config = userConfiguration(middleware)
  config.useFeature(() => ({ name: 'test', initialise: context => {
    expect(context).toEqual({ a: 1 })
    return {}
  } }))
  await config.construct()
  await config.initialise({ a: 1 })
})