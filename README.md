# @x/socket

Lightweight observable APIs over any socket

`x/socket` allows you to expose APIs transparently over any transport medium that implements the `send(message)` and 
`on('message', callback)` functions, such as Websockets, WebWorkers, WebRTC connections, child processes, etc. 
[Observable](https://www.npmjs.com/package/@x/observable) return values are automatically kept in sync.

A middleware layer is provided to allow functions to be enhanced with concerns such as authentication or caching. 
For more complete control over the function invocation, powerful "features" can be implemented.

## Installation

```shell
yarn add @x/socket
#or
npm i @x/socket
```

No socket implementation is provided out of the box and must be installed along with `@x/socket`. The 
[`ws Websocket package`](https://www.npmjs.com/package/ws) has been heavily tested and is recommended for Node.js 
and browser usage.

## A Simple Example

The `@x/socket` package consists of host and consumer components. This example sets up two API functions - one that 
will capitalize the provided text parameter and one that returns an observable that pulses every second. 

The API is configured on the host as follows:

```javascript
const host = require('@x/socket')
const { subject } = require('@x/observable')
const Websocket = require('ws')

const timer = subject()
let count = 0
setInterval(() => timer.publish(++count), 1000)

const api = {
  capitalize: text => text.toUpperCase(),
  timer: () => timer
}

host({ server: new Websocket.Server({ port: 3001 }) })
  .useApi(api)
  .useFeature('reestablishSessions') // automatically reestablish observable sessions if disconnected
```

The API is exposed to the consumer after making a successful connection:

```javascript
const consumer = require('@x/socket')

consumer().connect().then(async api => {
  console.log(await api.capitalize('hello, world')) // logs 'HELLO, WORLD'
  
  const timer = await api.timer()
  timer.subscribe(count => console.log(`Timer has pulsed ${count} times`))
})
```

## Host Configuration

The default export from the `@x/socket` package is the host factory function. It accepts a two parameters, the first 
being object containing connection options as follows. At least one of `server` or `socket` must be provided.

Name|Description
-|-
server|A socket server that accepts incoming connections through the `open` event
socket|An active socket, such as a child process or Websocket
httpServer|The underlying HTTP server object. This is used to enable access from features, as described below.

The second parameter is an object containing configuration options as follows.

Name|Description
-|-
log|Options passed to the [`@x/log`](https://www.npmjs.com/package/@x/log) logger facility. Ignored if `logger` is provided
logger|[`@x/log`](https://www.npmjs.com/package/@x/log) instance
serializer|An object containing options for the serializer, currently only `errorDetail`, set to `full`, `minimal` or `none`
throttle|An object containing API call throttling options, currently only a `timeout` value in milliseconds 

The factory function returns an object with functions as described below.

### `useApi`

Any functions attached to objects passed to the `useApi` function are added to the functions exposed on the consumer. 

### `use`



### `useFeature`



## Consumer Configuration

