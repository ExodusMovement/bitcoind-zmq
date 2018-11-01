const debug = require('debug')('bitcoind-zmq')
const zmq = require('zeromq')
const { EventEmitter2 } = require('eventemitter2')
const assert = require('assert').strict
const nextTick = require('util').promisify(process.nextTick)

const CONNECT_MAX_RETRY = 20
const EVENT_EMITTER_CONFIG = {
  wildcard: true,
  delimiter: ':',
  maxListeners: 20
}

class ZMQ extends EventEmitter2 {
  constructor (nodes, opts = {}) {
    super(EVENT_EMITTER_CONFIG)
    assert(typeof nodes === 'object', 'Please provide a valid ZMQ node/s object')
    this.nodes = {}
    this.opts = opts
    this.opts.maxRetry = this.opts.maxRetry || CONNECT_MAX_RETRY
    this.connRetries = {}
    for (const [nodeType, uri] of Object.entries(nodes)) {
      this.add(nodeType, uri)
    }
  }

  _onError (err, nodeType) {
    debug(`Error for ${nodeType}`, err)
    this.emit(`error:${nodeType}`, err, nodeType)
    this.disconnect(nodeType)
  }

  _onRetry (type) {
    this.connRetries[type] = this.connRetries[type] ? this.connRetries[type] + 1 : 1
    debug(`Reconnection attempt#${this.connRetries[type]} for "${type}"`)
    this.emit(`retry:${type}`, type, this.connRetries[type])
    if (this.connRetries[type] >= this.opts.maxRetry) {
      this.connRetries[type] = 0
      this._onError(new Error(`Max connect retry attempt reached (${this.opts.maxRetry})`), type)
    }
  }

  add (type, uri) {
    assert(type, 'Please provide a valid topic')
    assert(uri, 'Please provide a valid ZMQ node uri')
    const socket = zmq.socket('sub')
    socket.monitor(1, 0)
    debug(`Adding socket ${type}: ${uri}`)
    this.nodes[type] = { socket, uri }
  }

  async connect (nodeType = null) {
    let connectTo = Array.isArray(nodeType) ? nodeType : [nodeType]
    if (!nodeType) { // all sockets
      connectTo = Object.keys(this.nodes)
    }

    for (let type of connectTo) {
      assert(this.nodes[type], `node ${type} not found! Make sure to add it before connect()`)
      const { socket, uri } = this.nodes[type]

      socket.on('error', (err) => this._onError(new Error(`socket error: ${err.stack || err}`), type))
      socket.on('close', (err) => this.emit(`close:${type}`, new Error(`socket close: ${err.stack || err}`), type))
      socket.on('connect', () => this.emit(`connect:${type}`, uri, type))
      debug(`Connecting to ${uri}`)
      socket.connect(uri)
      debug(`Subscribing to ${type}`)
      socket.subscribe(type)
      socket.on('message', (topic, message) => this.emit(topic.toString(), message))
      socket.on('connect_retry', () => this._onRetry(type))
    }

    return nextTick()
  }

  async disconnect (nodeType = null) {
    let toDisconnect = Array.isArray(nodeType) ? nodeType : [nodeType]
    if (!nodeType) { // all sockets
      toDisconnect = Object.keys(this.nodes)
    }

    return Promise.all(toDisconnect.map((type) => new Promise((resolve, reject) => {
      const { socket, uri } = this.nodes[type]
      socket.removeAllListeners()

      socket.once('error', reject)
      socket.once('close', () => {
        this.emit(`close:${type}`, null, type)
        resolve()
      })

      debug(`Disconnecting ${uri}`)
      socket.close()
      if (socket.closed) socket.emit('close') // HACK: issue #273
    })))
  }
}

module.exports = ZMQ
