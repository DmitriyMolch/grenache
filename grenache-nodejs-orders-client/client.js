'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')

const linkUrl = process.env.LINK || 'http://127.0.0.1:30001'
const timeout = process.env.TIMEOUT || 10000
const linkPort = linkUrl.split(':')[2]
const orderEvent  = 'order:' + linkPort

console.log({ linkUrl })

const link = new Link({
  grape: linkUrl,
  requestTimeout: timeout
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

const payload = { order: { amount: 100, type: 'buy' }} // any data
peer.request(orderEvent, payload, { timeout }, (err, result) => {
  if (err) throw err
  console.log(
    'User sent:',
    JSON.stringify(payload.order),
    'and received:',
    JSON.stringify(result)
  )
  process.exit(-1)
})
