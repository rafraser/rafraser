import { loadPages } from "./build"
import { CONTENT_DIR } from "./util"
import fs from "fs"

async function buildTagTemplates() {
  const pages = await loadPages(`${CONTENT_DIR}/pages`)

  // Get a list of tags used
  const tags = pages.reduce((tagList, page) => {
    if(page.options.tags) {
      (page.options.tags as string[]).map(tag => {
        if (!tagList.includes(tag)) tagList.push(tag)
      })
    }

    return tagList
  }, [])

  await Promise.all(tags.map(buildTagTemplate))
}

async function buildTagTemplate(tag: string) {
  const tagPath = tag.toLowerCase().replace(" ", "-")
  const outputPath = `${CONTENT_DIR}/pages/tag/${tagPath}.md`
  try {
    await fs.promises.access(outputPath, fs.constants.F_OK)
    return
  } catch (err) {
    await fs.promises.writeFile(outputPath, tagTemplateContent(tag))
  }
}

function tagTemplateContent(tag: string) {
  return `---
title: "Tag: ${tag}"
subtext: All articles tagged with ${tag}
template: page_list
paginator:
  directory: post
  tag: ${tag}
---

Insert tag description here
`
}

// Build a markdown template for each tag
if(require.main === module) {
  buildTagTemplates().then(_ => {})
}