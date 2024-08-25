const { test, expect, beforeEach, describe } = require('@playwright/test')
import { loginWith, loginWithWrongPass } from './helper'
import { createBlog } from './helper'



describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:5173/api/testing/reset')
    await request.post('http://localhost:3001/api/users', {
      data: {
        name: 'mixxo',
        username: 'mixxo',
        password: '123456'
      }
    })
    await request.post('http://localhost:3001/api/users', {
      data: {
        name: 'toto',
        username: 'toto',
        password: '123456'
      }
    })
    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    const text = page.getByText('Log in to application')
    const username = page.getByText('username')
    const password = page.getByText('password')
    const loginButton = page.getByRole('button', {name:'login'})

    expect(text).toBeVisible()
    expect(username).toBeVisible()
    expect(password).toBeVisible()
    expect(loginButton).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
        await loginWith(page, 'mixxo', '123456')
        await expect(page.getByText('mixxo is logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
        await loginWithWrongPass(page, 'mixxo', 'hohoho')
        await expect(page.getByText('Wrong username or password')).toBeVisible()
    })

    describe('When logged in', () => {
        beforeEach(async ({ page }) => {
          await loginWith(page, 'mixxo', '123456')
        })
      
        test('a new blog can be created', async ({ page }) => {
          await createBlog(page, 'My own E2E test', 'doko doko', 'e2e.com')
          await expect(page.getByText('My own E2E test doko doko view')).toBeVisible()
        })
    
        test('a blog can be liked', async ({page}) => {
            await createBlog(page, 'My own E2E test', 'doko doko', 'e2e.com')
            await page.getByRole('button', {name:'view'}).click()
            await page.getByRole('button', {name:'like'}).click()
            await expect(page.getByTestId('likes')).toHaveText("1")
        })
    
        test('the user who added the blog can delete it', async ({page}) => {
            await createBlog(page, 'My own E2E test', 'doko doko', 'e2e.com')
            await page.getByRole('button', {name:'view'}).click()
            const removeButton = page.getByRole('button', {name:'remove'})
            await expect(removeButton).toBeVisible()
    
            removeButton.click()
            await page.on('dialog', dialog => dialog.accept())
            await expect(page.getByText('My own E2E test doko doko view')).not.toBeVisible()
    
        })

        test('user does not see remove button for blogs he did not create', async ({page}) => {
            await createBlog(page, 'My own E2E test', 'doko doko', 'e2e.com')
            await page.getByRole('button', {name: 'Log out'}).click()
            await loginWith(page, 'toto', '123456')
            await page.getByRole('button', {name:'view'}).click()
            await expect(page.getByRole('button', {name:'remove'})).not.toBeVisible()
        })

        test('blogs are ordered by likes in descending order', async({page}) => {
            await createBlog(page, 'First blog', 'doko doko', 'e2e.com')
            await createBlog(page, 'Third blog', 'doko doko', 'e2e.com')
            await createBlog(page, 'Second blog', 'doko doko', 'e2e.com')

            await page.getByRole('button', {name:'view'}).first().click()
            await page.getByRole('button', {name:'like'}).first().click()
            await page.getByRole('button', {name:'like'}).first().click()
            await page.getByRole('button', {name:'like'}).first().click()
            await page.getByRole('button', {name:'view'}).last().click()
            await page.getByRole('button', {name:'like'}).last().click()

            await page.getByRole('button', {name: 'Log out'}).click()
            await loginWith(page, 'toto', '123456')

            await expect(page.getByTestId('blog').nth(0)).toHaveText('First blog doko doko view')
            await expect(page.getByTestId('blog').nth(1)).toHaveText('Second blog doko doko view')
            await expect(page.getByTestId('blog').nth(2)).toHaveText('Third blog doko doko view')
        })
     })
  })

})