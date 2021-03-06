const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')
const keys = require('../config/keys')

const client = redis.createClient(keys.redisUrl)
client.hget = util.promisify(client.hget)
const exec = mongoose.Query.prototype.exec

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true
  this.hashKey = JSON.stringify(options.key || 'default') // make sure the key is a number or string
  return this // chainable
}

mongoose.Query.prototype.exec = async function () { // 需要this指向Query，並且能使用await
  if (!this.useCache) {
    return exec.apply(this, arguments)
  }

  const key = JSON.stringify(Object.assign({}, this.getQuery(), { // safely copy object from one to another
    collection: this.mongooseCollection.name
  }))

  // See if we have a value for 'key' in redis
  const cacheValue = await client.hget(this.hashKey, key)

  // If we do, return that
  if (cacheValue) {
    console.log('From cache')
    const doc = JSON.parse(cacheValue)
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc)
  }

  // Otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments) // 需要對result做一些處理 (mongoose documents -> JSON)，才能cache
  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10)

  return result
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey))
  }
}
