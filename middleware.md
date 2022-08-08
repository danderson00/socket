# Middleware

Middleware functions are injected into the call stack of API functions and can be used to inspect or modify passed
parameters returned results.

Middleware is added to the execution stack by calling the `use` function. This function accepts either a single
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

## Controlling Execution Flow

The context object contains an asynchronous function named `next` that is used to pass control to the next layer of the
execution stack. The parameters that are passed to this function will be used as the API function parameters
in the next layer. Executing this with no parameters will leave the function parameters unchanged.

The `next` function is always asynchronous and should be awaited or the promise returned. The return value from
middleware functions is passed back up to the preceding execution layer, allowing the result to be modified by
middleware. Returned promises will be awaited, and exceptions bubble up the stack.

## Host Connection Object

The host connection object is mutable and can be used to store connection specific information. It has the following
properties:

Name|Description
---|---
id|Unique connection identifier
log|The connection specific [logger](https://www.npmjs.com/package/@x/log) instance
socket|The underlying socket object
request|An object containing information about the request (generally [http.IncomingMessage](https://www.w3schools.com/nodejs/obj_http_incomingmessage.asp))
messages|An observable that emits all messages received by the connection
events|An observable that emits other events emitted by the connection, such as `error` and `close`

## Examples

### Injecting Parameters

The `next` function can be used to alter the parameters that are passed to the next layer. This example assumes a
property named `userId` has been attached to the connection object and inserts this as the first parameter to
the API call.

```javascript
const injectUserId = ({ next, connection }, ...args) => next(connection.userId, ...args) 
```

This would be loaded on the host like follows:

```javascript
host()
  .useApi({
    getData: (userId, recordId) => {/* load requested data */}
  })
  .use({
    getData: appendUserId
  })
```

The API should only be called with the `recordId` parameter:

```javascript
const api = await consumer().connect()
const data = await api.getData(recordId)
```

### Error Handling

Exceptions are bubbled up the execution stack and transparently flowed from host to consumer.

```javascript
const handleError = ({ next }) => {
  try {
    return next()
  } catch(error) {
    alert(`An error occurred: ${error.message}`)
  }
}
```

This could be loaded globally on the consumer like follows:

```javascript
const api = consumer()
  .use(handleError)
  .connect()
```
