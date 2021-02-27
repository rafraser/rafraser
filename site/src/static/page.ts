import { markdownParser } from "./parser/markdown"
import { once } from "events"
import YAML from "yaml"

import fs from "fs"
import path from "path"
import readline from "readline"

export class Page {
    options: Record<string, any>
    path: string
    content: string
}

export type ParserFunction = (raw: string) => string

const EXTENSION_PARSERS : { [key: string]: ParserFunction } = {
    "md": markdownParser
}

export async function loadPage(filepath: string, name: string): Promise<Page> {
    // Determine the body parser from extension
    const extension = path.extname(filepath)
    const contentParser = EXTENSION_PARSERS[extension] || markdownParser

    // Load & parse the page data
    return parseFile(filepath, name, contentParser)
}

async function parseFile(filepath: string, name: string, contentParser: ParserFunction): Promise<Page> {
    const rl = readline.createInterface({
        input: fs.createReadStream(filepath),
        crlfDelay: Infinity
    })

    let rawOptions = ""
    let options : Record<string, any> = {}
    let content = ""
    let firstline = true
    let readingHeader = false

    rl.on("line", line => {
        if(firstline && line.startsWith("---")) {
            readingHeader = true
            firstline = false
        } else if(readingHeader) {
            if(line.startsWith("---")) {
                readingHeader = false
            } else {
                rawOptions += line + "\n"
            }
        } else {
            content += line + "\n"
        }
    })

    await once(rl, "close")
    try {
        options = YAML.parse(rawOptions)
    } catch (err) {
        console.log(err)
        console.log(rawOptions)
    }
    if(!options) options = {}

    return {
        path: name,
        options: options,
        content: contentParser(content)
    }
}

export function pageToSettingsObject(page: Page): object {
    const obj : Record<string, any> = {}
    for (const key of Object.keys(page.options)) {
        obj[key] = page.options[key]
    }
    obj["content"] = page.content
    obj["path"] = page.path
    return obj
}