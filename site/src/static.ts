import { promises as fs } from "fs"
import path from "path"
import { loadPage } from "./page"

const CONTENT_DIR = "static-content"
const OUTPUT_DIR = "static-build"
const pages = []

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
  console.log(pages)
}

// Apply pages to templates and save
loadPagesInDirectory("static-content/pages").then(_ => {})