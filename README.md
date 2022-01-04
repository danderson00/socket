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

This example sets up two API functions - one that will capitalize the provided text parameter and one that returns an 
observable that pulses every second. 

Host configuration:

```javascript
const host = require('@x/socket')
const { subject } = require('@x/observable')
const Websocket = require('ws')

const timer = subject()
const count = 0
setInterval(() => timer.publish(++count), 1000)

const api = {
  capitalize: text => text.toUpperCase(),
  timer: () => timer
}

host({ server: new Websocket.Server({ port: 3001 }) })
  .useApi(api)
  .useFeature('reestablishSessions') // automatically reestablish observable sessions if disconnected
```

Consumer configuration:

```javascript
const consumer = require('@x/socket')

consumer().connect().then(async api => {
  console.log(await api.capitalize('hello, world')) // logs 'HELLO, WORLD'
  
  const timer = await api.timer()
  timer.subscribe(count => console.log(`Timer has pulsed ${count} times`))
})
```

## Host Configuration

The default export from the `@x/socket` package is the host factory function. It accepts a single parameter, an 
object containing the following possible options:

Name|Description
-|-
server|The socket server that accepts incoming connections.  

## Consumer Configuration

