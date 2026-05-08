import { marked } from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderer = new marked.Renderer()

renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : undefined
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value

  return `<pre><code class="hljs ${language ?? ''}">${highlighted}</code></pre>`
}

export const renderMarkdown = (content: string) => marked.parse(content, { renderer }) as string
