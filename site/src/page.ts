import { markdownParser } from "./parser/markdown"
import { once } from "events"

import fs from "fs"
import path from "path"
import readline from "readline"

export class Page {
    options: Map<string, string>
    path: string
    content: string
}

const EXTENSION_PARSERS = {
    "md": markdownParser
}

export async function loadPage(filepath: string): Promise<Page> {
    // Determine the body parser from extension
    const extension = path.extname(filepath)
    const contentParser = EXTENSION_PARSERS["md"] || markdownParser

    // Load & parse the page data
    return parseFile(filepath, contentParser)
}

async function parseFile(filepath: string, contentParser: (raw: string) => string): Promise<Page> {
    const rl = readline.createInterface({
        input: fs.createReadStream(filepath),
        crlfDelay: Infinity
    })

    let options : Map<string, string> = new Map()
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
            } else if(line.includes(": ")) {
                let [key, value] = line.split(": ").slice(0, 2)
                options.set(key, value)
            }
        } else {
            content += line + "\n"
        }
    })

    await once(rl, "close")
    return {
        path: filepath.substring(0, filepath.lastIndexOf('.')) || filepath,
        options: options,
        content: contentParser(content)
    }
}

export function pageToSettingsObject(page: Page): object {
    const obj : Record<string, any> = {}
    page.options.forEach((value, key) => obj[key] = value)
    obj["content"] = page.content
    return obj
  }