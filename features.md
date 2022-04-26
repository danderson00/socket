# Custom Features

Features are able to add API functions and middleware, have an asynchronous construction and initialization phase
and are able to hook in to other key events such as handshaking and socket reconnection.

## Host Features

```javascript
function hostFeature({ log, connections, hostOptions, server, httpServer }) {
  return {
    name: 'featureName',
    api: {
      apiFunction: (...args) => {}
    },
    middleware: {
      apiFunction: (context, ...args) => {}  
    },
    onConnect: context => {},
    handshake: ({ data: { featureName } }) => {}
  }
}
```

Features for use on the host should be implemented as factory functions that return a specific definition structure.
The function should accept a single parameter, an object containing infrastructure that can be manipulated. It has
the following properties:

Name|Description
---|---
log|The [logger](https://www.npmjs.com/package/@x/log) instance
connections|An observable that emits new connection objects
hostOptions|All host options
server|The provided socket server object
httpServer|The provided HTTP server object, if any

The function should return a definition with the following properties:

Name|Description
---|---
name|The name of the feature
api|Functions to add to the host API
middleware|Middleware to add to the execution stack
onConnect|A callback that executes when a new connection occurs. Passed the connection object
onDisconnect|A callback that executes when a connection is disconnected. Passed the connection object
handshake|A callback to interact with the handshaking process. See below

## Consumer Features

```javascript
function consumerFeature({ log, socket, sessions, middleware }) {
  return {
    name: 'featureName',
    handshakeData: () => ({ property: 'value' }),
    initialise: ({ api, handshakeData: { featureName } }) => {
      return {
        middleware: {
          apiFunction: (context, ...args) => {}
        },
        reconnect: context => {},
        disconnect: context => {}
      }
    }
  }
}
```

Construction of the consumer feature is a two step process. First, a factory function should accept an object 
with the following properties:

Name|Description
---|---
log|The [logger](https://www.npmjs.com/package/@x/log) instance
socket|The underlying socket object for the connection
sessions|An observable that emits new session objects
middleware|An object containing all other currently mounted middleware

It should return an object with the following properties:

Name|Description
---|---
name|The name of the feature
handshakeData|Data to include in the host handshake process. Can be a raw value or function that is called on each connect attempt
initialise|A callback that is executed once the handshake process is complete

The `initialise` function is passed an object with the following properties:

Name|Description
---|---
api|The API object
handshakeData|The result of the handshake process. Contains the result of host feature handshake callbacks, keyed by the feature name

The `initialise` function should return an object with the following properties:

Name|Description
---|---
middleware|Middleware to add to the execution stack
reconnect|A callback that executes when the connection is reestablished after being disconnected
disconnect|A callback that executes when the connection is disconnected

## Handshaking

The connection handshake process occurs in three distinct stages:

1. The consumer collects any handshake data from any consumer features that return a `handshakeData` property
   from initial construction. This data is passed to the host in a special handshake operation.
2. The host validates the handshake data and executes any `handshake` callbacks returned from host feature
   construction. The function accepts two arguments:
  - the first is the data sent from the consumer encapsulated in a property named `data`
  - the second is the session context, as described in the middleware section above.
    Data returned from this function is returned to the consumer in an object keyed by the feature name.
3. The consumer calls the `initialise` function on consumer feature definitions, passing the returned handshake data
   in a property called `handshakeData`.
