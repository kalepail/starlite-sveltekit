import { sveltekit } from '@sveltejs/kit/vite'
import inject from '@rollup/plugin-inject'
import path from 'path'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
	],
	server: {
		middlewareMode: 'ssr',
		// proxy: {
		// 	'^/connect/.*/ws': {
		// 		target: 'http://localhost:3030',
		// 		// ws: true,
		// 	}
		// }
	},
	optimizeDeps: {
		esbuildOptions: {
			define: {
				global: 'globalThis'
			},
			plugins: [
				NodeGlobalsPolyfillPlugin({
					process: true,
					buffer: true
				}),
			]
		}
	},
	build: {
		minify: 'esbuild',
		sourcemap: true,
		rollupOptions: {
			plugins: [
				inject({
					util: 'util',
					window: path.resolve('src/helpers/window.js'),
					Buffer: ['buffer', 'Buffer'],
				})
			]
		}
	}
};

export default config;
