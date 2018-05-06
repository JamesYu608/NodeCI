const puppeteer = require('puppeteer')
const sessionFactory = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory')

class CustomPage {
  static async build () {
    const browser = await puppeteer.launch({
      headless: false
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

    await page.goto('localhost:3000')
    await page.waitFor('a[href="/auth/logout"]')
  }

  async getContentsOf (selector) {
    return this.page.$eval(selector, el => el.innerHTML)
  }
}

module.exports = CustomPage
