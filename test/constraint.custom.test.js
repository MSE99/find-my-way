'use strict'

const t = require('tap')
const test = t.test
const FindMyWay = require('..')
const alpha = () => { }
const beta = () => { }
const gamma = () => { }
const delta = () => { }

const customHeaderConstraint = {
  name: 'requestedBy',
  storage: function () {
    let requestedBys = {}
    return {
      get: (requestedBy) => { return requestedBys[requestedBy] || null },
      set: (requestedBy, store) => { requestedBys[requestedBy] = store },
      del: (requestedBy) => { delete requestedBys[requestedBy] },
      empty: () => { requestedBys = {} }
    }
  },
  deriveConstraint: (req, ctx) => {
    return req.headers.accept
  }
}

test('A route could support a custom constraint strategy', t => {
  t.plan(3)

  const findMyWay = FindMyWay({ constraints: { requestedBy: customHeaderConstraint } })

  findMyWay.on('GET', '/', { constraints: { requestedBy: 'curl' } }, alpha)
  findMyWay.on('GET', '/', { constraints: { requestedBy: 'wget' } }, beta)

  t.equal(findMyWay.find('GET', '/', { requestedBy: 'curl' }).handler, alpha)
  t.equal(findMyWay.find('GET', '/', { requestedBy: 'wget' }).handler, beta)
  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'chrome' }))
})

test('A route could support a custom constraint strategy while versioned', t => {
  t.plan(8)

  const findMyWay = FindMyWay({ constraints: { requestedBy: customHeaderConstraint } })

  findMyWay.on('GET', '/', { constraints: { requestedBy: 'curl', version: '1.0.0' } }, alpha)
  findMyWay.on('GET', '/', { constraints: { requestedBy: 'curl', version: '2.0.0' } }, beta)
  findMyWay.on('GET', '/', { constraints: { requestedBy: 'wget', version: '2.0.0' } }, gamma)
  findMyWay.on('GET', '/', { constraints: { requestedBy: 'wget', version: '3.0.0' } }, delta)

  t.equal(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '1.x' }).handler, alpha)
  t.equal(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '2.x' }).handler, beta)
  t.equal(findMyWay.find('GET', '/', { requestedBy: 'wget', version: '2.x' }).handler, gamma)
  t.equal(findMyWay.find('GET', '/', { requestedBy: 'wget', version: '3.x' }).handler, delta)

  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'chrome' }))
  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'chrome', version: '1.x' }))

  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '3.x' }))
  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'wget', version: '1.x' }))
})

test('A route could support a custom constraint strategy while versioned and host constrained', t => {
  t.plan(9)

  const findMyWay = FindMyWay({ constraints: { requestedBy: customHeaderConstraint } })

  findMyWay.on('GET', '/', { constraints: { requestedBy: 'curl', version: '1.0.0', host: 'fastify.io' } }, alpha)
  findMyWay.on('GET', '/', { constraints: { requestedBy: 'curl', version: '2.0.0', host: 'fastify.io' } }, beta)
  findMyWay.on('GET', '/', { constraints: { requestedBy: 'curl', version: '2.0.0', host: 'example.io' } }, delta)

  t.equal(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '1.x', host: 'fastify.io' }).handler, alpha)
  t.equal(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '2.x', host: 'fastify.io' }).handler, beta)
  t.equal(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '2.x', host: 'example.io' }).handler, delta)

  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'chrome' }))
  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'chrome', version: '1.x' }))
  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '1.x' }))
  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '2.x' }))
  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '3.x', host: 'fastify.io' }))
  t.notOk(findMyWay.find('GET', '/', { requestedBy: 'curl', version: '1.x', host: 'example.io' }))
})
