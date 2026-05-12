const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browserPaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ];
  let executablePath = browserPaths.find(p => fs.existsSync(p));
  if (!executablePath) executablePath = '/Applications/Safari.app/Contents/MacOS/Safari'; // Fallback to Safari, but let's hope Chrome is there
  const browser = await puppeteer.launch({ executablePath, headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:8001/test-errors.html');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
