import { createMiniflareServer, createViteServer } from './src/_servers.js'

// TODO push mf object to vite so it could be referenced in the hook vs using the _mf file
  // Primarily so we don't have to double snag the durable object files

createMiniflareServer(true)
createViteServer(true)