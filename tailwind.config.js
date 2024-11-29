/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./apps/**/*.{html,ts}', './libs/**/*.{html,ts}'],
	theme: {
		extend: {
			screens: {
				'2xl': '1440px',
				FHD: '1920px',
				QHD: '2560px',
				'4k': '3840px',
			},
		},
	},
	plugins: [],
};
