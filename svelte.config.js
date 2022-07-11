import preprocess from "svelte-preprocess"
import adapter from '@sveltejs/adapter-cloudflare'
// import adapter from '@sveltejs/adapter-cloudflare-workers'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
    preprocess({
      postcss: true,
    }),
  ],
	kit: {
		adapter: adapter(),
		prerender: {
			enabled: false
		},
	}
};

export default config;
