import chromium from "@sparticuz/chromium-min";
import path from "path";
import fs from "fs/promises";
import handlebars from "handlebars";
// @ts-ignore 
import filter from "handlebars.filter";

import { PDFDocument } from "pdf-lib";


function eliminarAcentos(str:string) {
    return str
      .normalize('NFD') // Descompone los caracteres acentuados en su forma base y marcas de acento
      .replace(/[\u0300-\u036f]/g, '') // Elimina las marcas de acento
      .replace(/[^\x00-\x7F]/g, ''); // Elimina los caracteres no ASCII
  }



export const GET = async (req: Request) => {
    const reqUrl = new URL(req.url);
    const searchParams = reqUrl.searchParams;

    const questions: { [a: string]: string } = {
        "budget": "¿El prospecto tiene un presupuesto asignado para esta solución?",
        "authority":"¿Quiénes están involucrados en la toma de decisión del avance de este proyecto?",
        "pain":"¿Cuál es el principal problema o necesidad que buscan resolver con nuestra solución?",
        "currentSolution":"¿Cómo están manejando este problema o necesidad actualmente?",
        "timing":"¿Para cuándo necesitan implementar una solución o tomar la decisión?",
        "competition":"¿Están evaluando otras soluciones? Si es así, ¿cuáles?",
        "competitionAnalysis":"¿Qué les gusta y qué no les gusta de esas soluciones comparado con la nuestra?",
        "objection":"¿Hubo alguna objeción o preocupación destacada durante la reunión?",
        "reliever":"¿Qué aspectos de nuestra solución o propuesta generaron mayor interés o entusiasmo?",
        "nextSteps":"¿Cuáles fueron los próximos pasos establecidos en la reunión entre el comercial y el prospecto?",
        "comments":"Comentarios adicionales del equipo de prospección"
    }

    const questionsArray: { title: string, body: string }[] = []

    Object.keys(questions).forEach(parameter => {
        const body = searchParams.get(parameter)
        const title = questions[parameter]

        if (body) {
            questionsArray.push({ title, body })
        }

    })


    const companyName = searchParams.get("companyName")
    const meetingDate = searchParams.get("meetingDate")
    const companyLogo = searchParams.get("companyLogo")



    if (!companyName && !meetingDate) {
        return new Response(`Faltan los siguientes parámetros obligatorios en el URL: companyName y meetingDate`);
    }

    if (!companyName) {
        return new Response(`Faltan los siguientes parámetros obligatorios en el URL: companyName`);
    }

    if (!meetingDate) {
        return new Response(`Faltan los siguientes parámetros obligatorios en el URL: meetingDate`);
    }




    const templatePath = path.join(process.cwd(), 'public', 'views', 'output-meeting.hbs');
    const templateContent = await fs.readFile(templatePath, "utf-8");
    filter.registerHelper(handlebars);
    const template = handlebars.compile(templateContent);
    const html = template({ questions:questionsArray, companyName, companyLogo, meetingDate });

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
            headless: chromium.headless,
        });
    }
    else {
        puppeteer = await import("puppeteer")
        browser = await puppeteer.launch({
            headless: true,
        });

    }



    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.addStyleTag({ path: path.join(process.cwd(), 'public', 'styles', 'style.css') })
    await page.emulateMediaType('print')

    const pdfBuffer = await page.pdf({ printBackground: true, format: 'A4' });

    await browser.close();

    const pdf = await PDFDocument.load(pdfBuffer);
    const mergedPdf = await PDFDocument.create();
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
    });

    const mergedPdfBuffer = await mergedPdf.save();

    const pdfBlob = new Blob([mergedPdfBuffer], { type: "application/pdf", });

    return new Response(pdfBlob, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `filename=resumen_reunion_${eliminarAcentos(String(companyName))}.pdf`,

        },
        status: 200,
    });
}