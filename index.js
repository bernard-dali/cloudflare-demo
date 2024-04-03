import { launch } from 'puppeteer'
import { Solver } from '2captcha-ts'
import { readFileSync } from 'fs'

const APIKEY = process.env.APIKEY || "your_api_key" // Your https://2captcha.com  API key
const solver = new Solver(APIKEY)

const example = async () => {

    const browser = await launch({
        headless: false,
        devtools: true
    })

    const [page] = await browser.pages()

    const preloadFile = readFileSync('./inject.js', 'utf8');
    await page.evaluateOnNewDocument(preloadFile);

    // Here we intercept the console messages to catch the message logged by inject.js script
    page.on('console', async (msg) => {
        const txt = msg.text()
        if (txt.includes('intercepted-params:')) {
            const params = JSON.parse(txt.replace('intercepted-params:', ''))
            console.log(params)

            try {
                console.log(`Solving the captcha...`)
                const res = await solver.cloudflareTurnstile(params)
                console.log(`Solved the captcha ${res.id}`)
                console.log(res)
                await page.evaluate((token) => {
                    cfCallback(token)
                }, res.data)
            } catch (e) {
                console.log(e.err)
                return process.exit()
            }
        } else {
            return;
        }
    })

    // Go to target page
    page.goto('https://dexscreener.com')
}

example()