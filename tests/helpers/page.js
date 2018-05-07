const puppeteer = require('puppeteer')
const sessionFactory = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory')

class CustomPage {
  static async build () {
    const browser = await puppeteer.launch({
      headless: true, //
      args: ['--no-sandbox']
    })

    const page = await browser.newPage()
    const customPage = new CustomPage(page)

    return new Proxy(customPage, {
      get: function (target, property) {
        // 1個proxy包含3個class的properties
        // 這邊我們把browser也包進來的原因是，我們在testing中只用到了browser的launch跟close
        // 不如就一起放在proxy
        return customPage[property] || browser[property] || page[property]
      }
    })
  }

  constructor (page) {
    this.page = page
  }

  async login () {
    const user = await userFactory()
    const {session, sig} = sessionFactory(user)
    const page = this.page

    await page.setCookie({name: 'session', value: session})
    await page.setCookie({name: 'session.sig', value: sig})

    await page.goto('http://localhost:3000/blogs')
    await page.waitFor('a[href="/auth/logout"]')
  }

  async getContentsOf (selector) {
    return this.page.$eval(selector, el => el.innerHTML)
  }

  get (path) {
    return this.page.evaluate((_path) => { // 2. 避免跟上面的path混淆
      return fetch(_path, { // 3. 使用
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
    }, path) // 1. 注意這邊path要用args的方式傳入evaluate，否則真正在執行時會找不到
  }

  post (path, data) {
    return this.page.evaluate((_path, _data) => {
      return fetch(_path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data)
      }).then(res => res.json())
    }, path, data)
  }

  execRequests (actions) {
    return Promise.all(
      actions.map(({method, path, data}) => {
        return this[method](path, data) // this[method]()會呼叫this.get()或this.post()
      })
    )
  }
}

module.exports = CustomPage
