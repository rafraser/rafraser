import { Page, pageToSettingsObject } from "./page"
import { PAGE_SIZE, DEFAULT_TEMPLATE } from "./util"
import { applyTemplate } from "./templates"
import path from "path"

export async function applyPaginator(page: Page, pages: Page[]) {
  const paginator = page.options.paginator
  if(!paginator) return

  // Filter to pages within a directory
  if(paginator.directory) {
    const directory = paginator.directory
    pages = pages.filter(page => {
      const topLevel = path.basename(path.dirname(page.path))
      return topLevel == directory
    })
  }

  // Filter by tag
  if(paginator.tag) {
    const tag = paginator.tag
    pages = pages.filter(page => {
      const tags = (page.options.tags || []) as string[]
      return tags.includes(tag)
    })
  }

  // Apply pagination
  await paginate(page, pages)
}

async function paginate(page: Page, pages: Page[]) {
  const maxPage = Math.ceil(pages.length / PAGE_SIZE)
  const template = page.options.template || DEFAULT_TEMPLATE
  const promises = []

  for(let page_number=1; page_number <= maxPage; page_number++) {
    const pageFiles = pages.slice((page_number - 1) * PAGE_SIZE, page_number * PAGE_SIZE)
    const paginator_data = {
      pages: pageFiles.map(pageToSettingsObject),
      currentPage: page_number,
      maxPage: maxPage,
      path: page.path
    } as any

    // Links to next and previous pages
    if(page_number != 1) {
      paginator_data.prevPage = path.join(page.path, (page_number - 1).toString())
    } else if(page_number != maxPage) {
      paginator_data.nextPage = path.join(page.path, (page_number + 1).toString())
    }

    const parameters = {
      paginate: paginator_data,
      page: pageToSettingsObject(page),
    }
    promises.push(applyTemplate(template, path.join(page.path, (page_number).toString()), parameters))

    // Bit of a hack, but this generates an index.html and a 1.html page
    if(page_number == 1) {
      promises.push(applyTemplate(template, path.join(page.path, "index"), parameters))
    }
  }

  await Promise.all(promises)
}