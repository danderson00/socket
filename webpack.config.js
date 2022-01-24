// webpack.config.js
module.exports = {
  entry: ['@babel/polyfill', './dist/consumer/index.js'],
  output: {
    filename: 'socket.js',
    library: 'xsocket',
    // prevent error: `Uncaught ReferenceError: self is not define`
    globalObject: 'this',
  },
};