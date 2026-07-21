import { mkdir, writeFile } from "node:fs/promises"

await mkdir(new URL("../dist/server/", import.meta.url), { recursive: true })
await writeFile(
  new URL("../dist/server/index.js", import.meta.url),
  `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("text/html")) return response

    const requestUrl = new URL(request.url)
    const pageUrl = requestUrl.origin + requestUrl.pathname
    const imageUrl = requestUrl.origin + "/og.png"

    return new HTMLRewriter()
      .on('meta[property="og:url"]', {
        element(element) { element.setAttribute("content", pageUrl) },
      })
      .on('meta[property="og:image"]', {
        element(element) { element.setAttribute("content", imageUrl) },
      })
      .on('meta[name="twitter:image"]', {
        element(element) { element.setAttribute("content", imageUrl) },
      })
      .transform(response)
  },
}\n`,
)
