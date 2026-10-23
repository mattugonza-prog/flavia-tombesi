// Arma la carpeta dist/ con solo los archivos públicos del sitio.
// Cloudflare Pages publica dist/, así no se exponen sass/, README ni node_modules.
// Además completa los marcadores <!--comprar:producto--> con el precio y el
// botón de compra definidos en catalogo.json (la misma fuente que usa el servidor).
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const PUBLICOS = [
    'index.html', 'consultas.html', 'libros.html', 'masterclass.html', 'privacidad.html', 'gracias.html', '404.html',
    'css', 'js', 'img', 'fonts',
    '_headers', '_redirects', 'robots.txt', 'sitemap.xml',
];

const catalogo = JSON.parse(readFileSync('catalogo.json', 'utf8'));
const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const whatsapp = (texto) => `https://wa.me/5493512068745?text=${encodeURIComponent(texto)}`;

function bloqueCompra(slug) {
    const item = catalogo[slug];
    if (!item) throw new Error(`Producto inexistente en catalogo.json: ${slug}`);
    const esVideo = item.tipo === 'video';

    if (!item.disponible || !(item.precio > 0)) {
        return esVideo ? '' : `<div class="libro__pie"><strong>Próximamente</strong></div>
                        <a class="boton boton--secundario boton--sm boton--bloque" href="${whatsapp(`¡Hola Flavia! Quiero saber cuándo sale "${item.titulo}".`)}" target="_blank" rel="noopener">Avisame cuando salga</a>`;
    }

    const formulario = (clase, texto) => `<form class="compra" method="post" action="/api/comprar">
                            <input type="hidden" name="producto" value="${slug}">
                            <button type="submit" class="${clase}">${texto}</button>
                        </form>`;

    if (esVideo) {
        return `<div class="compra-destacada">
                    <p class="compra-destacada__precio">${pesos.format(item.precio)}</p>
                    ${formulario('boton boton--primario', 'Comprar la masterclass')}
                    <p class="compra-destacada__nota">Pagás con Mercado Pago y la ves al instante, durante ${item.diasAcceso} días.</p>
                </div>`;
    }
    return `<div class="libro__pie"><strong>${pesos.format(item.precio)}</strong><span>Ebook (PDF)</span></div>
                        ${formulario('boton boton--primario boton--sm boton--bloque', 'Comprar')}`;
}

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const ruta of PUBLICOS) {
    // Los mapas de Sass (.map) son solo para desarrollo
    cpSync(ruta, `dist/${ruta}`, { recursive: true, filter: (origen) => !origen.endsWith('.map') });
}

for (const pagina of PUBLICOS.filter((ruta) => ruta.endsWith('.html'))) {
    const destino = `dist/${pagina}`;
    const html = readFileSync(destino, 'utf8').replace(/<!--comprar:([a-z0-9-]+)-->/g, (_, slug) => bloqueCompra(slug));
    writeFileSync(destino, html);
}
console.log(`dist/ listo con ${PUBLICOS.length} entradas`);
