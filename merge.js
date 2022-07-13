import fs from 'fs'
import path from 'path'
import esbuild from 'esbuild'

const doFile = path.join(process.cwd(), '/src/lib/durable-objects/index.js')
  const { outputFiles: [{ text: doCode }] } = await esbuild.buildSync({
    entryPoints: [doFile],
    bundle: true,
    platform: 'neutral',
    write: false,
  })

const workerFile = path.join(process.cwd(), '/worker-site/worker.mjs')
const workerCode = fs.readFileSync(workerFile).toString('utf8')

fs.writeFileSync(workerFile, `
  ${workerCode}
  ${doCode}
`)