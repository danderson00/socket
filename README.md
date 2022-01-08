# @x/socket

Lightweight, reliable observable APIs over any socket

`x/socket` allows you to expose APIs transparently over any transport medium that implements the `send(message)` and 
`on('message', callback)` functions, such as Websockets, WebWorkers, WebRTC connections, child processes, etc. 
[Observable](https://www.npmjs.com/package/@x/observable) return values are automatically kept in sync.

Connections over unreliable networks will automatically be reconnected after disconnection. A middleware layer is 
provided to allow functions to be enhanced with concerns such as authentication or caching. For more complete control 
over the function invocation, powerful "features" can be implemented.

## Installation

```shell
yarn add @x/socket
#or
npm i @x/socket
```

No socket server implementation is provided out of the box and must be installed along with `@x/socket`. The 
[`ws Websocket package`](https://www.npmjs.com/package/ws) has been heavily tested and is recommended for Node.js 
and browser usage.

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
  .connect().then(async api => {
    console.log(await api.capitalize('hello, world')) // logs 'HELLO, WORLD'
    
    const timer = await api.timer()
    timer.subscribe(count => console.log(`Timer has pulsed ${count} times`))
  })
```

## Host Configuration

The default export from the `@x/socket` package is the host factory function. It can be explicitly referenced in the 
browser by importing `@x/socket/host`. 

The host factory function accepts a single parameter, an object containing options as follows. At least one of 
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

## Consumer Configuration

The default browser export from the `@x/socket` package is the consumer factory function. It can be explicitly 
referenced from Node.js by importing `@x/socket/consumer`.

The consumer factory function accepts a single parameter, an object containing options as follows.

Name|Description
---|---
url|The URL of the host to connect to. Defaults to the current window host and port or `ws://localhost:3001` if the current window host is `localhost`
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

## Middleware

Middleware is added to the execution stack by using the `use` function. This function accepts either a single 
function or an object with multiple functions attached. Passing a single function will cause the middleware to be 
executed for all API functions ("global" middleware). Passing an object will cause middleware to be executed only 
when the API function with the corresponding name is executed.

Middleware functions take the following form:

```javascript
(context, ...args) => {}
```

Parameters passed to the API function are spread on to the middleware function, starting at the second parameter. 
The context parameter contains properties as described below:

Name|Location|Description
---|---|---
id|Both|Unique operation session identifier
next|Both|Asynchronous function to pass control to the next layer in the execution stack 
args|Both|Array of parameters passed to the API function
connection|Host|The underlying connection object. See below for more information
hostApi|Host|An object encapsulating the API exposed by the host. See below for more information
log|Host|The [logger](https://www.npmjs.com/package/@x/log) instance
messages|Consumer|An observable that emits messages received for the current operation session
data|Consumer|Raw data sent to the host

### Controlling Execution Flow

The context object contains an asynchronous function named `next` that is used to pass control to the next layer of the 
execution stack. The parameters that are passed to this function will be used as the API function parameters 
in the next layer. Executing this with no parameters will leave the function parameters unchanged. The function is 
always asynchronous and should be awaited.

The return value from middleware functions is passed back up to the preceding execution layer. Returned promises
will be awaited, and exceptions bubble up the stack.

#### Example: Injecting Parameters

The `next` function can be used to alter the parameters that are passed to the next layer. This example assumes a 
property named `userId` has been attached to the connection object and appends this as an additional parameter to 
the API call.

```javascript
const appendUserId = ({ next, connection }, id) => next(id, connection.userId) 
```

#### Example: Error Handling

Exceptions are bubbled up the execution stack and transparently flowed from host to consumer.

```javascript
const handleError = ({ next }) => {
  try {
    next()
  } catch(error) {
    alert(`An error occurred: ${error.message}`)
  }
}
```

### Host Connection Object

The host connection object is mutable and can be used to store connection specific information. It has the following 
properties:

Name|Description
---|---
id|Unique connection identifier
log|The connection specific [logger](https://www.npmjs.com/package/@x/log) instance
socket|The underlying socket object
request|An object containing information about the request
messages|An observable that emits all messages received by the connection
events|An observable that emits other events emitted by the connection, such as `error` and `close`

## Features

### Built-In Features

The following built-in features are available.

#### `clientId`

Attaches a unique, per client UUID identifier named `clientId` to the connection object. The identifier is 
encrypted on the client to hide the value and prevent tampering. The value is also attached to relevant log entries.

Requires both host and consumer features to be enabled.

##### Options

Name|Location|Description
---|---|---
cipherKey|Host|Required. A `String` or `Buffer` used as the encryption key

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
[@x/socket.auth](https://www.npmjs.com/package/@x/socket.auth)|Authentication supporting multiple providers
[@x/socket.files](https://www.npmjs.com/package/@x/socket.files)|Simple file upload feature
[@x/socket.unify](https://www.npmjs.com/package/@x/socket.unify)|Provides essential functionality for the [unify platform](https://unifyjs.io/)

### Custom Features

Features are able to add API functions and middleware, have an asynchronous construction and initialization phase
and are able to hook in to other key events such as handshaking and socket reconnection.

Information on implementation of custom features is available [here](https://gitlab.com/danderson00/socket/-/blob/master/features.md).

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
