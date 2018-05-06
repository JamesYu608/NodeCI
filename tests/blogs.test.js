const Page = require('./helpers/page')

let page

beforeEach(async () => {
  page = await Page.build()
  await page.goto('localhost:3000')
})

afterEach(async () => {
  await page.close()
})

describe('When logged in', async () => {
  beforeEach(async () => {
    await page.login()
    await page.click('a.btn-floating')
  })

  // Refactor: Testing Blog Creation
  test('can see blog create form', async () => {
    const label = await page.getContentsOf('form label')
    expect(label).toEqual('Blog Title')
  })

  // Asserting Validation Errors
  describe('And using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('form button') // submit without any contents
    })

    test('the form shows and error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text')
      const contentError = await page.getContentsOf('.content .red-text')

      expect(titleError).toEqual('You must provide a value')
      expect(contentError).toEqual('You must provide a value')
    })
  })
})
