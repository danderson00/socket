# @x/socket

Lightweight observable APIs over any socket

`x/socket` allows you to expose APIs transparently over any transport medium that implements the `send(message)` and 
`on('message', callback)` functions, such as Websockets, WebWorkers, child processes, etc. Observable return values 
are automatically kept in sync.

A middleware layer is provided to allow functions to be enhanced with concerns such as authentication or caching. 
For more complete control over the function invocation, powerful "features" can be implemented.

## Installation

```shell
yarn add @x/socket
#or
npm i @x/socket
```

## Usage

@x/socket consists of host and consumer components