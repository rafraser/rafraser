import { Page } from "./page"

const templates = {} as Map<string, string>

function fetchTemplate(path: string): string {
    if (!templates.get(path)) {
        // load template here
    }

    return templates.get(path)
}

function applyTemplate(template: string, page: Page) {
    // apply template here
}