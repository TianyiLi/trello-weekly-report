import http from 'http'
import open from 'open'
import { appendingJS } from './htmlFile/input.html'

export function createTempServer(
  httpContent: string,
  update?: (str: string) => void
) {
  const server = http.createServer(function (req, res) {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.write(appendingJS(httpContent))
      res.end()
    } else if (req.url?.startsWith('/api/update')) {
      const raw = [] as string[]
      req.on('data', (data) => {
        raw.push(data)
      })
      req.on('end', () => {
        const data = raw.join('')
        try {
          const payload = JSON.parse(data) as { content: string }
          update?.(payload.content)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.write(JSON.stringify(payload))
          res.end()
        } catch (error) {
          console.error(error)
          res.writeHead(500)
          res.end()
        }
      })
    } else {
      res.writeHead(404)
      res.end('Cannot find')
    }
  })
  return new Promise<typeof server>((res) => {
    server.listen(5000, async () => {
      res(server)
      await open('http://localhost:5000/')
    })
  })
}
