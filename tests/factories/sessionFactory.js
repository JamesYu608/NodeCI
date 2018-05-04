const Buffer = require('safe-buffer').Buffer
const Keygrip = require('keygrip')
const keys = require('../../config/keys')
const keygrip = new Keygrip([keys.cookieKey])

module.exports = (user) => { // user is a mongo model
  const sessionObject = {
    passport: {user: user._id.toString()} // 注意: mongo model的_id是object，而非string，所以要toString
  }
  const session = Buffer.from(
    JSON.stringify(sessionObject)
  ).toString('base64')
  const sig = keygrip.sign('session=' + session)

  return {session, sig}
}
