import { promises as fs } from "fs"
import { Liquid } from "liquidjs"
import { Page, pageToSettingsObject } from "./page"
import { CONTENT_DIR, OUTPUT_DIR } from "./util"
import path from "path"

const engine = new Liquid()

const templates = new Map() as Map<string, string>

async function fetchTemplate(template: string): Promise<string> {
    if (!templates.get(template)) {
        const templateFile = path.join(`${CONTENT_DIR}/templates`, `${template}.html`)
        templates.set(template, await fs.readFile(templateFile, "utf8"))
    }

    return templates.get(template)
}

export async function applyPageTemplate(template: string, page: Page) {
    const parameters = {
        page: pageToSettingsObject(page),
    }
    await applyTemplate(template, page.path, parameters)
}

export async function applyTemplate(template: string, outpath: string, parameters: any) {
    const templateBody = await fetchTemplate(template)
    const outputPath = path.join(OUTPUT_DIR, `${outpath}.html`)
    parameters.content_dir = path.relative(path.dirname(outputPath), path.join(OUTPUT_DIR, "/assets"))

    const renderedTemplate = await engine.parseAndRender(templateBody, parameters)
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, renderedTemplate)

    console.log("Built: ", outputPath)
}