import http from 'http'
import open from 'open'

export function createTempServer(httpContent: string) {
  const server = http.createServer(function (req, res) {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.write(httpContent)
      res.end()
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
