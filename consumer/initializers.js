module.exports = () => {
  const initializers = []

  return {
    add: handler => {
      if(handler) {
        initializers.push(handler)
      }
    },
    execute: context => Promise.all(
      initializers.map(
        initializer => Promise.resolve(initializer(context))
      )
    )
  }
}