const mongoose = require('mongoose')

const exec = mongoose.Query.prototype.exec

mongoose.Query.prototype.exec = function () { // 需要this指向Query
  console.log('IM ABOUT TO RUN A QUERY')
  return exec.apply(this, arguments)
}
