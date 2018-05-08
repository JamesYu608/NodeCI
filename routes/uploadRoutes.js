const AWS = require('aws-sdk')
const uuid = require('uuid/v1') // nothing special about v1, just use it
const requireLogin = require('../middlewares/requireLogin')
const keys = require('../config/keys')

const s3 = new AWS.S3({
  accessKeyId: keys.accessKeyId,
  secretAccessKey: keys.secretAccessKey
})

module.exports = app => {
  app.get('/api/upload', requireLogin, (req, res) => {
    // Key是檔名，格式: 'myUserId/adasojiasfa (亂數).jpeg'
    // Note: 在S3的檔名使用'/'，會有類似(不是真的) folder的效果
    const key = `${req.user.id}/${uuid()}.jpeg` // 使用uuid來輕易地取得unique的亂數

    s3.getSignedUrl('putObject', {
      Bucket: 'james-blog-bucket',
      ContentType: 'image/jpeg', // 暫時hardcode
      Key: key
    }, (err, url) => res.send({key, url}))
  })
}
