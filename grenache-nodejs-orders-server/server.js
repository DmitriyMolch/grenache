'use strict'

const async = require('async')
const { PeerRPCServer, PeerRPCClient }  = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')

const linkUrl = process.env.LINK || 'http://127.0.0.1:30001'
const linkPort = linkUrl.split(':')[2]
const timeout = process.env.TIMEOUT || 10000
const pullUrls = process.env.PULL_URLS?.split(',') || [
  'http://127.0.0.1:40001'
]
const servicePort = parseInt(process.env.SERVICE_PORT) || 1337
const orderEvent  = 'order:' + linkPort
const distributeEvent = 'distribute:' + linkPort

const initPullPeers = (pullUrls) => {
  return pullUrls.map((url)=> {
    const link = new Link({
      grape: url,
      requestTimeout: timeout
    })
    link.start()
    
    const peer = new PeerRPCClient(link, {})
    peer.init()
    const linkPort = url.split(':')[2];
    peer.distributeEvent =  'distribute:' + linkPort; 
    return peer
  })
}
const pullPeers = initPullPeers(pullUrls)

let orderbook = []

const link = new Link({
  grape: linkUrl
})
console.log('Server started:', { linkUrl, pullUrls, servicePort })

link.start()

const peer = new PeerRPCServer(link, {})
peer.init()

const service = peer.transport('server')
service.listen(servicePort)

setInterval(() => {
  link.announce(orderEvent, service.port, {})
  link.announce(distributeEvent, service.port, {})
}, 1000)

service.on('request', (rid, key, payload, handler) => {
  payload.order.linkUrl = linkUrl;
  console.log('request:', {  rid, key, payload })
  async.waterfall([
    (next) => {
      processOrder(payload.order, next)
    },
    (order, next) => {
      // TODO: investigate why distribution is not working as Grenache client may send request to the same client server which is different from the client configuration
      // if(key === orderEvent) {
      //   distribute(order, next) 
      // } else {
      //   next(null, order)
      // }
      next(null, order)
    }
  ],
  (err, res) => {
      if (err) console.error(err)
      handler.reply(err, res)
  });
})

const processOrder = (order, cb) => {
  // The orders matching mechanism is not clear from the task description so simple order push and rejection for duplicates one were impelemented
  const oderExists = orderbook.find(processedOrder => JSON.stringify(processedOrder) === JSON.stringify(order)) 
  if (!oderExists) {
    orderbook.push(order)
    console.log('process:', { order, orderbook })
    cb(null, order)
  } else {
    cb(new Error('Order rejected as it exists already:' + JSON.stringify(order)))
  }
}

const distribute = (order, cb) => {
  const payload = { order }
  const requests = pullPeers.map((peer) => 
    (next) => {
      console.log({distributeEvent: peer.distributeEvent})
      peer.request(peer.distributeEvent, payload, { timeout }, (err, res)=> {
        console.log(peer.distributeEvent, { payload, err, res })
        next(err, res)
      })
    }
  )

  async.parallel(requests, cb)
}