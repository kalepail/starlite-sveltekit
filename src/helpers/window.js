import { browser } from "$app/env"

if (!browser) {
  globalThis.Buffer = Buffer
  globalThis.window = {}
}

export default globalThis