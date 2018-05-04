const mongoose = require('mongoose')
const User = mongoose.model('User')

// Jest: new node environment -> file along (server code / test code)
module.exports = () => {
  return new User({}).save()
}
