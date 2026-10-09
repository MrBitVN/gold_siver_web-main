const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function run() {
  let browser;
  try {
    console.log("Launching browser...");
    // Try to find Chrome on Windows if puppeteer bundled doesn't exist
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\ADMIN\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
    ];
    let executablePath = chromePaths.find(p => fs.existsSync(p));
    
    const launchOptions = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (executablePath) {
      console.log("Using Chrome at:", executablePath);
      launchOptions.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log("Navigating to http://localhost:3000/ ...");
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for initial render
    await new Promise(r => setTimeout(r, 4000));

    // Check DOM content
    const pageContent = await page.content();

    const hasWM2NS = pageContent.includes('WM2NS') || pageContent.includes('CUNG TIỀN M2 MỸ');
    const hasFailedFetch = pageContent.includes('Failed to fetch') || pageContent.includes('Lỗi khi tải dữ liệu');
    const hasKhongCoDuLieu = pageContent.includes('Không có dữ liệu');

    console.log("Check WM2NS present:", hasWM2NS);
    console.log("Check 'Failed to fetch' error present:", hasFailedFetch);
    console.log("Check 'Không có dữ liệu' present:", hasKhongCoDuLieu);

    // Take Desktop Screenshot
    const artifactsDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\d42adf5b-84fa-4886-893d-f0773bba07a1';
    const desktopScreenshotPath = path.join(artifactsDir, 'localhost_desktop.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log("Saved desktop screenshot to:", desktopScreenshotPath);

    // Mobile viewport test
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await new Promise(r => setTimeout(r, 2000));
    const mobileScreenshotPath = path.join(artifactsDir, 'localhost_mobile.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log("Saved mobile screenshot to:", mobileScreenshotPath);

    console.log("VERIFICATION COMPLETE!");
  } catch(err) {
    console.error("Puppeteer error:", err.message);
  } finally {
    if (browser) await browser.close();
  }
}

run();
