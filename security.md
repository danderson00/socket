# `@x/socket` Security

Socket connections can be secured using a number of mechanisms - 

- users can be authenticated using the [`@x/socket.auth feature`](https://www.npmjs.com/package/@x/socket.auth)
- middleware can be used to authorise users and restrict access to API functions based on user and other context
- the handshake process can accept or refuse connections based on a provided payload, for example, the `apiKey` feature

## Authenticating users with `@x/socket.auth`

The `socket.auth` feature provides an authentication service with out of the box support for 
[Auth0](https://Auth0.com/),
[AWS Cognito](https://aws.amazon.com/cognito/),
[facebook login](https://developers.facebook.com/docs/facebook-login/) 
and a simple username / password provider for development purposes. Other external providers can easily be added using 
a generic provider. The feature adds a number of functions to the host API for authenticating users and retrieving the 
current status.

For external providers, an access token must first be obtained from the relevant provider by logging in using the
relevant SDK. For example, loading the facebook SDK and calling `FB.login` will return an access token after logging
in.

This token must then be attached to the payload of the `authentication` function exposed by the host.

```javascript
FB.login().then(({ authResponse }) => {
  if(authResponse.accessToken) {
    return host.authenticate({ provider: 'facebook', facebookToken: authResponse.accessToken })
  }
})
```

The Cognito provider also adds a `login` function to the consumer API that completes the entire login flow using the 
hosted UI.

## Authorizing API functions using middleware

After successful authentication, user data is attached to the current connection object and is made available on the
middleware context object.

```javascript
const requireAuthentication = ({ connection: { user }, next }) => {
  if(!user) {
    throw new Error("You must be logged in")
  }
  return next()
}

host
  .useFeature(auth({ password: true }))
  .useApi({
    getData: id => { /* retrieve sensitive data */ }
  })
  .use({
    getData: requireAuthentication
  })
```

Additional user information returned from authentication providers is attached to the user object on the `data` 
property.

### Loading additional user context after authentication

Middleware can also be used to load additional information about the user and attach it to the user object.

```javascript
host.use({
  getData: async ({ connection, next }) => {
    const result = await next()
    if(result.success) {
      // the user object is mutable - attached data will be exposed through the 
      // `connection.user` object for the life of the connection
      result.user.externalData = await loadExternalData(result.user.username)
    }
    return result
  }
})
```

## Restricting socket connections using the handshake process

Before any API calls can be made, the consumer must negotiate the handshake process successfully. The handshake must be 
initiated within a preset period (one second by default) or the connection is closed. No other messages will receive a 
response until the handshake is successful.

Features can be configured with functions to interact with the handshake process.

Consumer features can be defined with a `handshakeData` property that is a value or function that returns data to be 
handed to the host.

```javascript
module.exports = apiKey => () => ({
  name: 'apiKey',
  handshakeData: apiKey,
})
```

Host features can be configured with a `handshake` property that is executed when the host receives a handshake request.
The first parameter to this function is an object, keyed by feature name, containing data provided by the consumer 
through the `handshakeData` property. The results of this function are in turn passed back to the consumer and made 
available to the feature's initialisation phase (see the [features guide](features.md) for more information).

Throwing an error from this function causes the socket to be disconnected. Affected consumers will have promises 
returned from the `connect` call rejected.

```javascript
module.exports = apiKey => {
  return () => ({
    name: 'apiKey',
    handshake: ({ data }, context) => {
      const valid = typeof apiKey === 'function' ? apiKey(data.apiKey) : data.apiKey === apiKey
      if(!valid) {
        throw new Error('Invalid API key')
      }
      context.connection.apiKey = data.apiKey
    }
  })
}
```

The examples shown here are the [consumer](consumer/features/apiKey.js) and [host](host/features/apiKey.js) from the
built in `apiKey` feature.

## Custom external authentication provider - a simple example

```javascript
host.useFeature(auth({
  // return the user object on successful authentication, or a falsy value to fail
  external: ({ code }) => code === 'secret_code' && { username: 'user' },  
  secret: 'askljd78euiw8#wsehui@#%asd789sd',
  anonymous: false
}))
```

```javascript
// the consumer authenticate call looks like
api.authenticate({ provider: 'external', code: 'secret_code' })
```