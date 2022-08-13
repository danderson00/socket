# @x/socket

Ultra reliable, lightweight observable APIs over any socket

`x/socket` allows you to expose APIs transparently over any transport medium that implements the `send(message)` and 
`on('message', callback)` functions, such as Websockets, WebWorkers, WebRTC connections, child processes, etc. 
[Observable](https://www.npmjs.com/package/@x/observable) return values are automatically kept in sync.

Connections over unreliable networks will automatically be reconnected after disconnection. A middleware layer is 
provided to allow functions to be enhanced with concerns such as authentication or caching. For more complete control 
over the function invocation, powerful "[features](https://gitlab.com/danderson00/socket/-/blob/master/features.md)" 
can be implemented.

`@x/socket` is designed to work with 
[`@x/observable`](https://www.npmjs.com/package/@x/observable) observables, including expressions and models built 
using [`@x/expressions`](https://www.npmjs.com/package/@x/expressions). To expose and consume 
[ReactiveX](https://rxjs.dev/) observables, check out the 
[socket.rx feature](https://www.npmjs.com/package/@x/socket.rx). 

## A Simple Example

The `@x/socket` package consists of host and consumer components. This example sets up two API functions - one that 
will capitalize the provided text parameter and one that returns an observable that pulses every second. 

The API is configured on the host as follows:

```javascript
const host = require('@x/socket')
const { observable } = require('@x/observable')
const Websocket = require('ws')

const server = new Websocket.Server({ port: 3001 })

const timerObservable = observable(publish => {
  let count = 0
  setInterval(() => publish(++count), 1000)
})

const api = {
  capitalize: text => text.toUpperCase(),
  timer: () => timerObservable
}

host({ server }).useApi(api)
```

The API is exposed to the consumer after making a successful connection:

```javascript
const consumer = require('@x/socket')

consumer()
  .useFeature('reestablishSessions') // automatically reestablish observable sessions if disconnected
  .connect()
  .then(async api => {
    console.log(await api.capitalize('hello, world')) // logs 'HELLO, WORLD'
    
    const timer = await api.timer()
    timer.subscribe(count => console.log(`Timer has pulsed ${count} times`))
  })
```

A more detailed location sharing example is available 
[here](https://gitlab.com/danderson00/socket/-/tree/master/samples/share-location).

## Installation

```shell
yarn add @x/socket ws
# or
npm i @x/socket ws
```

No socket server implementation is provided out of the box and must be installed along with `@x/socket`. The
[`ws Websocket package`](https://www.npmjs.com/package/ws) has been heavily tested and is recommended for Node.js usage.

A browser package for the consumer is also available at `dist/consumer.min.js` and can be loaded to a webpage using:

```html
<script src="https://unpkg.com/@x/socket/dist/consumer.min.js"></script>
```

The library is exposed as `window.xsocket`.

## Host Configuration

The default export from the `@x/socket` package is the host factory function. It can be explicitly referenced in the 
browser by importing `@x/socket/host`. 

The host factory function accepts a single parameter, an object containing the following options. At least one of 
`server` or `socket` must be provided.

Name|Description
---|---
server|A socket server that accepts incoming connections through the `open` event
socket|An active socket, such as a child process object
httpServer|Optional. The underlying HTTP server object. This is only used to enable access from features, as described below
log|Options passed to the [`@x/log`](https://www.npmjs.com/package/@x/log) logger facility. Ignored if `logger` is provided
logger|[`@x/log`](https://www.npmjs.com/package/@x/log) instance
serializer|An object containing options for the serializer, currently only `errorDetail`, set to `full`, `minimal` or `none`
throttle|An object containing API call throttling options, currently only a `timeout` value in milliseconds 
handshakeTimeout|Milliseconds to wait before disconnecting a socket without a successful handshake (default: 1000)

## Consumer Configuration

The default browser export from the `@x/socket` package is the consumer factory function. It can be explicitly 
referenced from Node.js by importing `@x/socket/consumer`.

The consumer factory function accepts a single parameter, an object containing options as follows.

Name|Description
---|---
url|The URL of the host to connect to. Defaults to the current window host and path or `ws://localhost:3001` if the current window host is `localhost`
socket|An active socket, such as a child process or WebWorker object
socketFactory|Provide an alternative socket factory for when `window.WebSocket` is not available, such as from a Node.js process
reconnectDelay|Milliseconds to wait before attempting to reconnect
timeout|Milliseconds to wait before attempting to retransmit a failed command
log|Options passed to the [`@x/log`](https://www.npmjs.com/package/@x/log) logger facility. Ignored if `logger` is provided
serializer|An object containing options for the serializer, currently only `errorDetail`, set to `full`, `minimal` or `none`

The consumer object also exposes an asynchronous function named `connect` that initiates the connection process.

## Attaching Behavior

The factory functions return an object with functions as described below. All are chainable.

### `useApi(apiFunctions)`

Add functions attached to the provided object to the API exposed on the consumer. Only available on the host.

If a function returns an [observable](https://www.npmjs.com/package/@x/observable) object, the function exposed on the
consumer will also return an observable that will be updated as new values are emitted by the host observable.
Calling the `disconnect` function on the consumer observable will cause subscriptions to be cleaned up.

### `use(middlewareFunctions)`

Add a middleware layer to the execution stack.

### `useFeature(feature, options)`

Add a feature to the execution stack. The `feature` parameter should either be the name of a built in feature or a
feature factory function.

### Using Expressions

Standard observables such as those returned to the consumer from API functions can be extended to enable 
expressions to be built from them:

```javascript
import expressions from '@x/expressions'

...

// using the timer API from above that emits a simple count
const o = await api.timer()
expressions(o)
  .assign({
    hostCount: o => o,            // assign the value emitted by the host
    consumerCount: o => o.count() // count the messages on the consumer 
  })
  .subscribe(({ hostCount, consumerCount }) => {
    console.log(`Pulsed on host ${hostCount} times, on consumer ${consumerCount} times`)
  })
```

## Cleaning Up

Observables returned from API functions have an additional function property called `disconnect` that can be called 
to signal the host to clean up internal subscriptions and call the `disconnect` function on the corresponding 
observable. This also occurs if the socket is disconnected for any reason.

To use the `timerObservable` above as an example, we can cancel the `setTimeout` call like follows:

```javascript
const timerObservable = observable((publish, o) => {
  let count = 0
  const handle = setInterval(() => publish(++count), 1000)
  
  // functions returned from the observable function are called by the `disconnect` function
  return () => clearTimeout(handle)
})
```

### Isolating Consumer Disconnects With Proxies

To share a single observable instance between multiple consumers without having disconnect calls affecting other 
consumers, observables can be wrapped in `proxy` observables:

```javascript
const { proxy } = require('@x/observable')

const api = {
  timer: () => proxy(timerObservable)
}
```

When `disconnect` is called on a proxy, the proxy simply unsubscribes from its parent observable.

## Security

`@x/socket` provides comprehensive low level functionality for authenticating users and authorising their actions. 

See the [security guide](https://gitlab.com/danderson00/socket/-/blob/master/security.md) for more information.

## Middleware

Middleware functions are injected into the call stack of API functions. They can be used to inspect or modify passed
parameters and returned results.

See the [middleware guide](https://gitlab.com/danderson00/socket/-/blob/master/middleware.md) for detailed information.

## Features

Features are able to add API functions and middleware, have asynchronous construction and initialization phases
and are able to hook in to other key events such as handshaking and socket reconnection.

### Built-In Features

The following built-in features are available. They should be loaded by using the `useFeature` function:

```javascript
hostOrConsumer.useFeature(name, options)
```

#### `apiKey`

Prevents interaction with the API unless a valid API key is provided.

Requires both host and consumer features to be enabled.

##### Options

The options argument should be a static value containing the value to check, or a function. The host function should 
return a truthy value to allow access. The consumer function should return the value to check. 

#### `clientId`

Attaches a unique, per client UUID identifier named `clientId` to the connection object. The identifier is 
encrypted on the client to hide the value and prevent tampering. The value is also attached to relevant log entries.

Requires both host and consumer features to be enabled.

##### Options

Name|Location|Description
---|---|---
cipherKey|Host|Required. A `String` or `Buffer` used as the encryption key

#### `configuration`

Passes a static value provided on the host to a callback on the consumer.

##### Options

The host should be configured with the static value to be passed to the consumer.

The consumer should be configured with a callback that receives the value.

#### `heartbeat`

Periodically perform a network request to prevent disconnection by proxies, load balancers, etc.

Requires both host and consumer features to be enabled.

##### Options

Name|Location|Description
---|---|---
interval|Consumer|Milliseconds between requests. Default: 30000

#### `log`

Adds a `log` function to the consumer API that appends entries to the system log with relevant context information 
attached. Unhandled exceptions that occur on both consumer and host are also logged. 

Requires both host and consumer features to be enabled.

##### Options

Name|Location|Description
---|---|---
unhandled|Both|Set to false to disable logging of unhandled exceptions

#### `reestablishSessions`

Automatically reestablish subscriptions to active observables if the socket is disconnected and reconnected.

The feature is only required to be enabled on the consumer.

### Other Available Features

A number of other features are available as separate packages:

Name|Description
---|---
[socket.auth](https://www.npmjs.com/package/@x/socket.auth)|Authentication supporting multiple providers
[socket.files](https://www.npmjs.com/package/@x/socket.files)|Simple file upload feature
[socket.unify](https://www.npmjs.com/package/@x/socket.unify)|Provides essential functionality for the [unify platform](https://unifyjs.io/)

### Custom Features

Information on implementation of custom features is available [here](https://gitlab.com/danderson00/socket/-/blob/master/features.md).

## Project Status

This library and other libraries under the `@x` scope are under active development and are used in production systems.

We would love to hear from you! Please raise an [issue](https://gitlab.com/danderson00/socket/-/issues) if you have any 
questions or issues, or alternatively tweet [@danderson00](https://twitter.com/danderson00/).

## License

**The MIT License (MIT)**

Copyright © 2022 Dale Anderson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
documentation files (the “Software”), to deal in the Software without restriction, including without limitation the 
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit 
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the 
Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
