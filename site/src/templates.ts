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

export async function applyTemplate(template: string, page: Page) {
    const templateBody = await fetchTemplate(template)
    const parameters = pageToSettingsObject(page)
    const renderedTemplate = await engine.parseAndRender(templateBody, parameters)
    const outputPath = path.join(OUTPUT_DIR, `${page.path}.html`)

    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, renderedTemplate)
}