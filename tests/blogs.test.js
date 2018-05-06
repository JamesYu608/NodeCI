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

  // Asserting Validation Success
  describe('And using valid inputs', async () => {
    beforeEach(async () => {
      // entering our text then click submit
      await page.type('.title input', 'My Title')
      await page.type('.content input', 'My Content')
      await page.click('form button')
    })

    test('Submitting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5')
      expect(text).toEqual('Please confirm your entries')
    })

    test('Submitting then saving adds blog to index page', async () => {
      await page.click('button.green')
      await page.waitFor('.card')

      const title = await page.getContentsOf('.card-title')
      const content = await page.getContentsOf('p')
      expect(title).toEqual('My Title')
      expect(content).toEqual('My Content')

    })
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
