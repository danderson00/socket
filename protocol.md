# xsocket Protocol

## Handshake

1. Consumer connects to host
2. Consumer sends request packet
```json
{
  "version": "0.0.1"
}
```
3. Host 
  a. validates request version
  b. calls out to loaded APIs to validate request
  c. responds with ack and service schema
```json
{
  "status": "ok",
  "operations": [
    { "name": "hello" }
  ]
}
```
  d. starts listening for API requests

## API request / response

### Request Format

```JSON
{
  "id": 1,
  "operation": "hello",
  "arguments": []
}
```

### Response Format

```JSON
{
  "id": 1, 
  "operation": "hello", 
  "status": "ok", 
  "data": "world"
}
```

### Response Statuses
|Status|Meaning|
|---|---|
|ok|Operation completed successfully. Result is in the `data` property|
|error|Operation completed with error. Error detail is in the `data` property|
|update|Plugins such as `xest` will respond with this status when an update occurs. Additional data is in the `data` property|
|timeout|Used when an operation completes successfully after the timeout has been exceeded. Result is in the `data` property|