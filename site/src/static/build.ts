import { promises as fs } from "fs"
import { Page, loadPage } from "./page"
import { CONTENT_DIR, OUTPUT_DIR, DEFAULT_TEMPLATE } from "./util"
import { applyPageTemplate } from "./templates"
import { applyPaginator } from "./paginator"
import { spawn } from "child_process"
import path from "path"

export async function loadPages(directory: string) {
  const files = await getFiles(directory)
  return Promise.all(files.map(file => {
    let name = file.substr(directory.length)
    name = name.substring(0, name.lastIndexOf('.')) || name
    return loadPage(file, name)
  }))
}

async function getFiles(directory: string): Promise<string[]> {
  const dirents = await fs.readdir(directory, { withFileTypes: true})
  const files = await Promise.all(dirents.map(dirent => {
    const res = path.join(directory, dirent.name)
    return dirent.isDirectory() ? getFiles(res) : Promise.resolve([res])
  }))
  return Array.prototype.concat(...files)
}

async function buildPagesInDirectory(directory: string) {
  const pages = await loadPages(directory)
  await Promise.all(pages.map(page => buildPage(page, pages)))
}

async function buildPage(page: Page, pages: Page[]) {
  if(page.options.get("paginator")) {
    await applyPaginator(page, pages)
  } else {
    await applyPageTemplate(page.options.get("template") || DEFAULT_TEMPLATE, page)
  }
}

async function copyAssets() {
  const cp = spawn("cp", ["-a", `${CONTENT_DIR}/assets/.`, `${OUTPUT_DIR}/assets/`])
  cp.on("error", err => console.error(err))
}

async function buildStaticSite() {
  await copyAssets()
  await buildPagesInDirectory(`${CONTENT_DIR}/pages`)
}

// Apply pages to templates and save
if(require.main === module) {
  buildStaticSite().then(_ => {})
}