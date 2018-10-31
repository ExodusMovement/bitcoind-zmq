const BitcoindZmq = require('../')

const btcd = new BitcoindZmq({
  hashtx: 'tcp://127.0.0.1:28332',
  rawblock: 'tcp://127.0.0.1:28332',
  hashblock: 'tcp://127.0.0.1:28333',
  rawtx: 'tcp://127.0.0.1:28334'
})

btcd.connect()

btcd.on('hashblock', (hash) => {
  console.log('got block hash:', hash) // hash <Buffer ... />
})

btcd.on('hashtx', (hash) => {
  console.log('got tx hash:', hash) // hash <Buffer ... />
})

btcd.on('rawblock', (block) => {
  console.log('got raw block:', block) // block <Buffer ... />
})

btcd.on('rawtx', (tx) => {
  console.log('got raw tx:', tx) // tx <Buffer ... />
})

btcd.on('connect:*', (uri, type) => {
  console.log(`socket ${type} connected to ${uri}`)
})

btcd.on('error:*', (err, type) => {
  console.error(`${type} had error:`, err)
})

btcd.on('retry:*', (type, attempt) => {
  console.log(`type: ${type}, retry attempt: ${attempt}`)
})
