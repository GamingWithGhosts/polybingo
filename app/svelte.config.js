import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),

		vite: () => ({
			resolve: {
				alias: {
					'@components': '/src/components'
				}
			},
			server: {
				https: true
			},
			envPrefix: 'CLIENT'
		})
	}
};

export default config;
