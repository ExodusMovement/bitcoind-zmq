# bitcoind-zmq

[![NPM Version](https://img.shields.io/npm/v/bitcoind-zmq.svg)](https://www.npmjs.com/package/bitcoind-zmq)
![node](https://img.shields.io/node/v/bitcoind-zmq.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

> Get ZMQ notifications from bitcoind-like coins

## Install

> npm install --save bitcoind-zmq

And make sure to run bitcoind or whatever btc-like coin (that support zmq) with his [zmq options](https://github.com/bitcoin/bitcoin/blob/master/doc/zmq.md).

> bitcoind -zmqpubhashtx=tcp://127.0.0.1:28332 -zmqpubhashblock=tcp://127.0.0.1:28332

## Usage example

```javascript
const BitcoindZmq = require('bitcoind-zmq')

const opts = { maxRetry: 20 }

const btcd = new BitcoindZmq({
  // topic: <zmq node>
  hashtx: 'tcp://127.0.0.1:28332',
  hashblock: 'tcp://127.0.0.1:28332',
  rawtx: 'tcp://127.0.0.1:28334',
  rawblock: 'tcp://127.0.0.1:28334'
}, opts)

btcd.connect()

btcd.on('hashblock', (hash) => {
  // hash <Buffer ... />
})

btcd.on('hashtx', (hash) => {
  // hash <Buffer ... />
})

btcd.on('rawblock', (block) => {
  // block <Buffer ... />
})

btcd.on('rawtx', (tx) => {
  // tx <Buffer ... />
})

btcd.on('connect:*', (uri, type) => {
  console.log(`socket ${type} connected to ${uri}`)
})

btcd.on('retry:hashtx', (type, attempt) => {
  console.log(`hashtx, connect retry attempt: ${attempt}`)
})

btcd.on('error:*', (err, type) => {
  console.error(`${type} had error:`, err)
})
```

### API

The `BitcoindZMQ({...}, <opts>)` Class accepts in his constructor `topic -> zmq node` pairs. The only option available is `maxRetry` the maximum n. of attempt to connect to a zmq node.

- `.add(<type>, <uri>)`: Add a `topic -> zmq node` pair (ex. `.add('hashtx', 'tcp://127.0.0.1:28333')`).
- `.on(<eventName>, <fn>)`: the event name could be a [EventEmitter2](https://github.com/EventEmitter2/EventEmitter2) pattern with namespaces (ex. `.on('connect:hashtx', () => console.log('watching hashtx'))`).
- `.connect(<nodeType>)`: *nodeType* could be a **String**/**Array** of previously added topics to connect to. If none is provided it will connect to all the added nodes.
- `.disconnect(<nodeType>)`: disconnect from the given nodes or from all nodes if no argument is provided.

Also refer to the example for usage.

*Bitcoind* available events are, but you can add only the ones you want or new one for other coins:

- `hashblock`
- `hashtx`
- `rawblock`
- `rawtx`

Reserved events and namespaces:

- `error:*`
- `close:*`
- `connect:*`
- `disconnect:*`
- `retry:*`

example: `error:*` will catch every node error (`error:hashblock`, `error:hashtx`, and so on...)

### Debug

> DEBUG=bitcoind-zmq

### License

MIT
