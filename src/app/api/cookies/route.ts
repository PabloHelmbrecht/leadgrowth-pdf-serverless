import chromium from "@sparticuz/chromium-min";
import path from "path";
import { NextResponse } from "next/server";



export const GET = async (req: Request) => {
    const reqUrl = new URL(req.url);
    const searchParams = reqUrl.searchParams;




    let puppeteer

    let browser

    if (process.env.NODE_ENV !== "development") {
        puppeteer = await import("puppeteer-core");

        browser = await puppeteer.launch({
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(
                path.join(process.cwd(), 'public', 'chromium')
            ),
            headless: false,
        });
    }
    else {
        puppeteer = await import("puppeteer")
        browser = await puppeteer.launch({
            headless: false,
        });

    }

    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 600 });

    // Ir a la página de login
    await page.goto('https://app.apollo.io/#/login', { waitUntil: 'networkidle2' });

    
    
    // Esperar a que aparezca el campo de email
    await page.waitForSelector('input[name="email"]', { timeout: 1000 });
    


    // Escribir las credenciales
    await page.type('input[name="email"]', 'stefania.alvarez@oneinfotechnology.com', { delay: 10 });
    await page.type('input[name="password"]', '9By5Fo9ZlGmS35Z', { delay: 10 });

    // Hacer clic en el botón de login
    await page.click('button[type="submit"]');

    // Esperar la navegación después del login
    await page.waitForNavigation();

    // Obtener cookies
    const cookies = await page.cookies();
    console.log('Cookies obtenidas:', cookies);

    await browser.close();

          return NextResponse.json(cookies, { status: 200 });
    



}