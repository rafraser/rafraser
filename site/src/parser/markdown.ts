import marked from "marked"

export function markdownParser(rawContent: string): string {
    return marked(rawContent)
}