import { promises as fs } from "fs"
import { Liquid } from "liquidjs"
import { Page, pageToSettingsObject } from "./page"
import { CONTENT_DIR, OUTPUT_DIR } from "./util"
import path from "path"

const engine = new Liquid()
const templates = new Map() as Map<string, string>
const components = new Map() as Map<string, string>

async function fetchTemplate(template: string): Promise<string> {
    if (!templates.get(template)) {
        const templateFile = path.join(`${CONTENT_DIR}/templates`, `${template}.html`)
        let templateContent = await fs.readFile(templateFile, "utf8")

        // Fill in include tags
        // We could just let LiquidJS do this for us - but there's a couple of benefits here
        //  - we only really need the contents, nothing else fancy going on
        //  - this way we can memoize the component loads for zoom zoom speeds
        templateContent = await replaceAsync(templateContent, /{% include [\"\'](.*)[\"\'] %}/gm, async (_, group) => {
            console.log(group)
            return await fetchComponent(group)
        })
        templates.set(template, templateContent)
    }

    return templates.get(template)
}

async function replaceAsync(str: string, regex: RegExp, func: (match: string, ...args: string[]) => Promise<string>): Promise<string> {
    const promises : Promise<string>[] = []
    str.replace(regex, (match: string, ...args: string[]) => {
        promises.push(func(match, ...args))
        return ""
    })

    const data = await Promise.all(promises)
    return str.replace(regex, () => data.shift());
}

async function fetchComponent(component: string): Promise<string> {
    if(!components.get(component)) {
        const componentFile = path.join(`${CONTENT_DIR}/components`, `${component}.html`)

        try {
            components.set(component, await fs.readFile(componentFile, "utf8"))
        } catch(e) {
            components.set(component, "")
        }
    }

    return components.get(component)
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
    parameters.content_dir = path.relative(path.dirname(outputPath), OUTPUT_DIR)

    const renderedTemplate = await engine.parseAndRender(templateBody, parameters)
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, renderedTemplate)
    console.log("Built: ", outputPath)
}