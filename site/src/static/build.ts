import { promises as fs } from "fs"
import { loadPage } from "./page"
import { CONTENT_DIR, OUTPUT_DIR, DEFAULT_TEMPLATE } from "./util"
import { applyTemplate } from "./templates"
import { spawn } from "child_process"
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

async function buildPagesInDirectory(path: string) {
  const files = await getFiles(path)
  const pages = await Promise.all(files.map(file => {
    let name = file.substr(path.length)
    name = name.substring(0, name.lastIndexOf('.')) || name
    return loadPage(file, name)
  }))

  await Promise.all(pages.map(page => {
    applyTemplate(page.options.get("template") || DEFAULT_TEMPLATE, page)
  }))
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
buildStaticSite().then(_ => {})