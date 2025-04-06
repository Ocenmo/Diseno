import tailwindcss from '@tailwindcss/postcss';

export default {
  plugins: [
    tailwindcss(),
    (await import('autoprefixer')).default,
  ],
}
