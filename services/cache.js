const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')

const redisUrl = 'redis://127.0.0.1:6379'
const client = redis.createClient(redisUrl)
client.get = util.promisify(client.get)
const exec = mongoose.Query.prototype.exec

mongoose.Query.prototype.cache = function () {
  this.useCache = true
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
  const cacheValue = await client.get(key)

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
  client.set(key, JSON.stringify(result))

  return result
}
