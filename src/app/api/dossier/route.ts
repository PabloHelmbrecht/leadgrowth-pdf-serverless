import chromium from "@sparticuz/chromium-min";
import path from "path";
import fs from "fs/promises";
import handlebars from "handlebars";
import { PDFDocument } from "pdf-lib";
import { cache } from "react";
// @ts-ignore 
import filter from "handlebars.filter";

function extractLinkedInId(url: string) {
    const regex = /linkedin\.com\/(company|in)\/([^\/\?]+)/;
    const match = url.match(regex);
    if (match && match[2]) {
        return `/${match[2]}`;
    }

    return null;
}

function eliminarAcentos(str:string) {
    return str
      .normalize('NFD') // Descompone los caracteres acentuados en su forma base y marcas de acento
      .replace(/[\u0300-\u036f]/g, '') // Elimina las marcas de acento
      .replace(/[^\x00-\x7F]/g, ''); // Elimina los caracteres no ASCII
  }

function formatUrl(url: string) {
    return url
        .replace(/^https?:\/\//, '')  // Elimina http:// o https://
        .replace(/^www\./, '')         // Elimina www.
        .split('/')[0];                // Toma solo el dominio principal, antes de cualquier ruta
}

// Función para quitar acentos y pasar a minúsculas
function quitarAcentosYMinusculas(str: string) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Genera variantes del nombre completo
function generarVariantesNombre(fullName: string): string[] {
    const partes = fullName.split(/\s+/).filter(Boolean);
    const variantes = new Set<string>();

    // Todas las combinaciones posibles de las partes del nombre
    for (let i = 0; i < partes.length; i++) {
        for (let j = i; j < partes.length; j++) {
            const variante = partes.slice(i, j + 1).join(' ');
            variantes.add(variante);
        }
    }
    // También agregar el nombre completo
    variantes.add(fullName);

    // Agregar versiones normalizadas (sin acentos y minúsculas)
    const variantesNormalizadas = Array.from(variantes).map(quitarAcentosYMinusculas);
    console.log({variantesNormalizadas, variantes})
    return [...variantes, ...variantesNormalizadas];
}

// Reemplaza todas las variantes por XXXX, robusto a acentos y mayúsculas
function ofuscarNombreEnTexto(texto: string, fullName: string): string {
    const variantes = generarVariantesNombre(fullName)
        .map(v => quitarAcentosYMinusculas(v))
        .sort((a, b) => b.length - a.length); // Primero las variantes más largas

    let textoNormalizado = quitarAcentosYMinusculas(texto);
    let resultado = texto;

    variantes.forEach(variant => {
        if (!variant.trim()) return;
        let idx = 0;
        while ((idx = textoNormalizado.indexOf(variant, idx)) !== -1) {
            // Encuentra la posición en el texto original
            resultado = resultado.substring(0, idx) + '<span class="blur-sm">XXXXXXX</span>' + resultado.substring(idx + variant.length);
            textoNormalizado = quitarAcentosYMinusculas(resultado);
            idx += 4; // Avanza después de 'XXXX'
        }
    });
    return resultado;
}

export const GET = async (req: Request) => {
    const reqUrl = new URL(req.url);
    const searchParams = reqUrl.searchParams;

    const parametersNames = [
        "companyName",
        "meetingDate",
        "companyLogo",
        "companyDescription",
        "website",
        "companyLinkedin",
        "companyCity",
        "companyCountry",
        "companyPhone",
        "industries",
        "fundingYear",
        "revenue",
        "headcount",
        "fullName",
        "photo",
        "prospectPhone",
        "emailContext",
        "email",
        "role",
        "prospectLinkedin",
        "prospectCity",
        "prospectCountry",
        "assistants",
        "companyLinkedinFormatted",
        "prospectLinkedinFormatted",
        "websiteFormatted",
        "companyLocation",
        "prospectLocation",
        "includeAssistants",
        "serviceModel",
        "isTurboSales"

    ] as const

    const obligatoryParameters: ParameterNames[] = [
        "companyName",
        "meetingDate",
        "companyDescription",
        "website",
        "fullName",
        "emailContext",
        "role",
        "serviceModel"
    ]



    type ParameterNames = typeof parametersNames[number];


    const parameters = parametersNames.reduce((acc: { [key in ParameterNames]?: unknown }, name) => {

        let value: string | boolean | null | string[] = searchParams.get(name)

        if (name === "industries") {


            try {
                value = value ? value.split(",").map(i => i.trim()) : null

            }
            catch (e) {
                console.error(e)
                value = null
            }
        }

      


        if (name === "assistants") {

            try {
                value = value ? JSON.parse(String(value)) : null
            }
            catch (e) {
                console.error(e)
                value = null
            }
        }

        if (name === "isTurboSales") {

            try {
                value = acc.serviceModel === "Turbo Sales"
            }
            catch (e) {
                console.error(e)
                value = null
            }

        }

        // if (name === "emailContext") {

        //     try {
        //         if (value && acc.fullName) {
        //             if (typeof value === "string") {
        //                 value = ofuscarNombreEnTexto(value, String(acc.fullName));
        //                 console.log({value, name: acc.fullName})
        //             } else if (typeof value === "object" && value !== null) {
        //                 for (const key in value) {
        //                     if (typeof value[key] === "string") {
        //                         value[key] = ofuscarNombreEnTexto(value[key], String(acc.fullName));
        //                     }
        //                 }
        //             }
        //         }
        //     }
        //     catch (e) {
        //         console.error(e)
        //         value = null
        //     }
        // }


        if (name === "includeAssistants") {

            try {
                value = Array.isArray(acc.assistants) && acc.assistants.length > 0
            }
            catch (e) {
                console.error(e)
                value = null
            }

        }


        if (name === "companyLinkedinFormatted" && acc.companyLinkedin) {
            value = extractLinkedInId(String(acc.companyLinkedin))
        }

        if (name === "prospectLinkedinFormatted" && acc.prospectLinkedin) {
            value = extractLinkedInId(String(acc.prospectLinkedin))
        }


        if (name === "websiteFormatted" && acc.website) {
            value = formatUrl(String(acc.website))
        }

        if (name === "companyLocation") {

            if (acc.companyCountry && !acc.companyCity) {

                value = String(acc.companyCountry)

            }

            if (acc.companyCountry && acc.companyCity) {
                value = `${acc.companyCity}, ${acc.companyCountry}`

            }

            if (!acc.companyCountry && acc.companyCity) {

                value = String(acc.companyCity)

            }
        }

        if (name === "prospectLocation") {
            if (acc.prospectCountry && !acc.prospectCity) {

                value = String(acc.prospectCountry)

            }

            if (acc.prospectCountry && acc.prospectCity) {
                value = `${acc.prospectCity}, ${acc.prospectCountry}`

            }

            if (!acc.prospectCountry && acc.prospectCity) {

                value = String(acc.prospectCity)

            }
        }




        if (!value) return acc


        return { ...acc, [name]: value }

    }, {})


    const missingParams = obligatoryParameters.reduce((acc: string, name, index) => {
        if (!parameters[name]) {
            if (index === 0) {
                return `${acc}${name}`
            }

            return `${acc}, ${name}`

        }

        return acc
    }, "")


    if (missingParams !== "") {
         return new Response(`Faltan los siguientes parámetros obligatorios en el URL: ${missingParams}`);
    }



    const templatePath = path.join(process.cwd(), 'public', 'views', 'dossier.hbs');
    const templateContent = await fs.readFile(templatePath, "utf-8");
    filter.registerHelper(handlebars);

    const template = handlebars.compile(templateContent);
    const html = template(parameters);

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

    const pdfBuffer = await page.pdf({ printBackground: true, height: "37cm", width: "21cm" });

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
            "Content-Disposition": `filename=dossier_${eliminarAcentos(String(parameters.companyName)) ?? ''}_${eliminarAcentos(String(parameters.fullName)) ?? ''}.pdf`,

        },
        status: 200,
    });
}