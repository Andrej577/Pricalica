import { expect, test } from '@playwright/test'

const apiBaseUrl = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000'
const appBasePathPattern = /#\/?$/

async function gotoLoginPage(page) {
  let lastError

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(appBasePathPattern)
      await expect(page.getByTestId('login-form')).toBeVisible()
      return
    } catch (error) {
      lastError = error

      if (!String(error).includes('ERR_EMPTY_RESPONSE') || attempt === 5) {
        throw error
      }

      await page.waitForTimeout(1000)
    }
  }

  throw lastError
}

async function loginAsUser(page) {
  await gotoLoginPage(page)
  const loginForm = page.getByTestId('login-form')
  await loginForm.locator('input[autocomplete="email"]').fill('sara.juric@example.com')
  await loginForm.locator('input[autocomplete="current-password"]').fill('SaraLove44')
  await loginForm.getByTestId('login-button').click()
  await expect(page).toHaveURL(/pocetna/)
}

async function loginAsAdmin(page) {
  await gotoLoginPage(page)
  const loginForm = page.getByTestId('login-form')
  await loginForm.locator('input[autocomplete="email"]').fill('maja.peric@example.com')
  await loginForm.locator('input[autocomplete="current-password"]').fill('Maja*Secure5')
  await loginForm.getByTestId('login-button').click()
  await expect(page).toHaveURL(/admin\/korisnici/)
}

test('prijava korisnika radi preko jedinstvene forme', async ({ page }) => {
  await loginAsUser(page)
  await expect(page.getByText('Biblioteka')).toBeVisible()
})

test('odjava vraca korisnika na login ekran', async ({ page }) => {
  await loginAsUser(page)

  await page.getByTestId('logout-button').click()

  await expect(page).toHaveURL(/#\/login$/)
  await expect(page.getByTestId('login-form')).toBeVisible()
})

test('pretraga knjiga na pocetnoj stranici filtrira popis', async ({ page }) => {
  await loginAsUser(page)

  const searchInput = page.locator('input[placeholder*="Pretra"]').first()
  await searchInput.fill('Tajna vrta')

  await expect(page.getByText('Tajna vrta').first()).toBeVisible()
  await expect(page.getByText('Ponoćni vlak')).toHaveCount(0)
})

test('otvaranje detalja knjige prikazuje detalje i recenzije', async ({ page }) => {
  await loginAsUser(page)

  await page.getByText('Tajna vrta').first().click()

  await expect(page).toHaveURL(/knjige\/\d+/)
  await expect(page.getByTestId('book-title')).toBeVisible()
  await expect(page.getByText('Autor')).toBeVisible()
  await expect(page.getByText('Recenzije', { exact: true })).toBeVisible()
})

test('admin moze urediti korisnika u admin dijelu', async ({ page }) => {
  const uniqueSuffix = Date.now()

  const createResponse = await page.request.post(`${apiBaseUrl}/korisnici`, {
    data: {
      ime: 'Playwright',
      prezime: 'User',
      email: `playwright.edit.${uniqueSuffix}@example.com`,
      lozinka: 'test123',
      tipKorisnika: 3,
      statusRacuna: 1,
    },
  })
  const createdUser = await createResponse.json()

  await loginAsAdmin(page)
  await page.goto('/#/admin/korisnici')

  const row = page.locator('tbody tr').filter({
    has: page.getByText(createdUser.email),
  })

  await row.locator('.q-checkbox').click()
  await page.getByRole('button', { name: 'Uredi' }).click()
  await expect(page).toHaveURL(new RegExp(`/profil/${createdUser.korisnik_id}$`))

  await page.locator('input[autocomplete="given-name"]').fill('Ažurirano')
  await page.getByTestId('save-user-button').click()

  await expect(page.getByText('Podaci o korisniku su spremljeni.')).toBeVisible()

  await page.request.delete(`${apiBaseUrl}/korisnici/${createdUser.korisnik_id}`)
})

test('admin moze obrisati korisnika uz potvrdu dijaloga', async ({ page }) => {
  const uniqueSuffix = Date.now()

  const createResponse = await page.request.post(`${apiBaseUrl}/korisnici`, {
    data: {
      ime: 'Playwright',
      prezime: 'Delete',
      email: `playwright.delete.${uniqueSuffix}@example.com`,
      lozinka: 'test123',
      tipKorisnika: 3,
      statusRacuna: 1,
    },
  })
  const createdUser = await createResponse.json()

  await loginAsAdmin(page)
  await page.goto('/#/admin/korisnici')

  const row = page.locator('tbody tr').filter({
    has: page.getByText(createdUser.email),
  })

  await row.locator('.q-checkbox').click()
  await page.getByRole('button', { name: 'Izbriši' }).first().click()

  const dialog = page.locator('.q-dialog')
  await expect(dialog.getByText('Potvrda brisanja')).toBeVisible()
  await dialog.getByRole('button', { name: 'Izbriši' }).click()

  await expect(page.getByText('Korisnik je obrisan.')).toBeVisible()
})

test('prikazuje gresku ako API ne vrati podatke', async ({ page }) => {
  await page.route('**/knjige', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Namjerna greška za test' }),
    })
  })

  await loginAsUser(page)
  await expect(page.getByText('Neuspjelo učitavanje knjiga.')).toBeVisible()
})
