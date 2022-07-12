import fs from 'fs'
import path from 'path'

const workerFile = path.join(process.cwd(), '/worker-site/worker.mjs')
const workerCode = fs.readFileSync(workerFile).toString('utf8')

const doFile = path.join(process.cwd(), '/src/lib/durable-objects/sockets.js')
const doCode = fs.readFileSync(doFile).toString('utf8')

fs.writeFileSync(workerFile, `
  ${workerCode}
  ${doCode}
`)