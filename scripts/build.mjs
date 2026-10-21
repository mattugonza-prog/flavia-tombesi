// Arma la carpeta dist/ con solo los archivos públicos del sitio.
// Cloudflare Pages publica dist/, así no se exponen sass/, README ni node_modules.
import { cpSync, rmSync, mkdirSync } from 'node:fs';

const PUBLICOS = [
    'index.html', 'consultas.html', 'libros.html', 'masterclass.html', 'privacidad.html', '404.html',
    'css', 'js', 'img', 'fonts',
    '_headers', '_redirects', 'robots.txt', 'sitemap.xml',
];

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const ruta of PUBLICOS) {
    // Los mapas de Sass (.map) son solo para desarrollo
    cpSync(ruta, `dist/${ruta}`, { recursive: true, filter: (origen) => !origen.endsWith('.map') });
}
console.log(`dist/ listo con ${PUBLICOS.length} entradas`);
