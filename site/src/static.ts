import { promises as fs } from "fs"
import { loadPage } from "./page"
import { CONTENT_DIR, DEFAULT_TEMPLATE } from "./util"
import { applyTemplate } from "./templates"
import path from "path"

async function getFiles(directory: string): Promise<string[]> {
  const dirents = await fs.readdir(directory, { withFileTypes: true})

  const test = dirents.map(dirent => {
      const res = path.join(directory, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : Promise.resolve([res])
  })
  const files = await Promise.all(test)

  return Array.prototype.concat(...files)
}

// Load all into memory
async function loadPagesInDirectory(path: string) {
  const files = await getFiles(path)
  const pages = await Promise.all(files.map(file => loadPage(file)))

  await Promise.all(pages.map(page => {
    applyTemplate(page.options.get("template") || DEFAULT_TEMPLATE, page)
  }))
}

// Apply pages to templates and save
loadPagesInDirectory(`${CONTENT_DIR}/pages`).then(_ => {})