# Flavia Tombesi · Crianza y Mentalidad

Sitio web de Flavia Tombesi, docente y coach en Psicología Positiva: consultas online,
libros y masterclass. Sitio estático (HTML + Sass + JavaScript sin dependencias),
publicado en Cloudflare Pages.

## Páginas

| Ruta | Contenido |
|---|---|
| `/` | Presentación, dos ejes (mentalidad y crianza), cómo es una consulta, quién soy |
| `/consultas` | Detalle de la consulta, para quién es, formulario que arma el mensaje de WhatsApp y preguntas frecuentes |
| `/libros` | Catálogo de ebooks con compra por Mercado Pago |
| `/masterclass` | Cuenta regresiva, lista de espera (FormSubmit) y compra por Mercado Pago cuando esté disponible |
| `/gracias` | Confirma el pago y entrega el ebook o la masterclass |
| `/privacidad` | Política de privacidad |

## Desarrollo

```bash
npm install
npm run sass:watch   # recompila css/estilos.css al guardar
npm run dev          # arma dist/ y lo sirve localmente (sin las funciones de compra)
npm run build        # compila el CSS y arma dist/ con solo los archivos públicos
npx wrangler pages dev dist   # sirve dist/ con las funciones de compra (requiere .dev.vars)
```

Los colores, tipografías y espaciados están en `sass/_variables.scss`.

## Publicación (Cloudflare Pages)

Configuración del proyecto en Cloudflare Pages:

| Opción | Valor |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |

- Cada push a `main` publica el sitio automáticamente.
- `_headers` define caché y cabeceras de seguridad; `_redirects`, las redirecciones.
  Pages resuelve solo las URLs limpias (`/consultas`) y la página `404.html`.
- La dirección provisoria es `https://flavia-tombesi.pages.dev`. Al contratar el dominio,
  reemplazarla en los `<head>` de las páginas, `sitemap.xml`, `robots.txt` y el campo
  `_next` del formulario de `masterclass.html`.

## Venta de ebooks y masterclass (Mercado Pago)

### Cómo funciona

1. El botón "Comprar" envía el producto a `functions/api/comprar.js`, que crea el pago en
   Mercado Pago con el precio de `catalogo.json` (nunca el del navegador) y redirige al checkout.
   Se excluyen efectivo y cajeros para que la aprobación sea inmediata.
2. Al terminar, Mercado Pago devuelve a `/gracias?payment_id=…`. La página llama a
   `functions/api/verificar.js`, que consulta el pago **directamente a Mercado Pago**.
3. Si está aprobado, devuelve un enlace firmado (vence en 6 horas) a `functions/api/archivo.js`,
   que entrega el PDF o el video desde el almacenamiento privado R2.
4. Cada compra puede abrir el material hasta 10 veces dentro de `diasAcceso` (7 días para ebooks,
   30 para la masterclass). Flavia recibe el aviso de venta de Mercado Pago; no tiene que hacer nada.

Si alguien pagó y perdió la página, Flavia puede pedirle el número de operación y mandarle
`https://<sitio>/gracias?payment_id=NUMERO` mientras esté dentro del plazo de acceso.

### Configuración inicial (una sola vez)

1. **Credenciales de Mercado Pago (cuenta de Flavia):** en
   [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) → *Crear aplicación*
   (Checkout Pro) → *Credenciales de producción* → copiar el **Access Token**.
2. **Almacenamiento R2 (cuenta de Cloudflare):** *R2 → Create bucket* con el nombre `flavia-material`
   (privado; no activar acceso público).
3. **KV:** *Workers & Pages → KV → Create namespace* `flavia-accesos`.
4. **En el proyecto de Pages → Settings → Bindings:**
   - R2 bucket: nombre de variable `MATERIAL` → `flavia-material`
   - KV namespace: nombre de variable `ACCESOS` → `flavia-accesos`
5. **En Settings → Variables and Secrets** (tipo *Secret*):
   - `MP_ACCESS_TOKEN`: el Access Token de producción de Flavia
   - `FIRMA_SECRETA`: una clave larga al azar (por ejemplo, generada con `openssl rand -hex 32`)
6. Volver a publicar (*Deployments → Retry deployment*) para que tome la configuración.

Para probar sin dinero real, usar las credenciales de prueba de Mercado Pago y sus usuarios de prueba.
Localmente, crear un archivo `.dev.vars` (ignorado por Git) con `MP_ACCESS_TOKEN` y `FIRMA_SECRETA`.

### Estado actual y pendientes para abrir la venta

- La compra se probó de punta a punta (28/10/2026) con credenciales **de prueba** de Mercado Pago.
- `MP_ACCESS_TOKEN` sigue siendo el **de prueba** hasta que Flavia tenga el dominio oficial.
  Al pasar a producción: en Mercado Pago Developers (cuenta real de Flavia) → *Credenciales* →
  pestaña **Productivas** → copiar el **Access Token** (no la Public Key) → reemplazarlo en
  Cloudflare (*Settings → Variables and Secrets*, entorno Production) → *Retry deployment*.
- Con el dominio, actualizar además la dirección en los `<head>`, `sitemap.xml`, `robots.txt` y el
  campo `_next` de `masterclass.html`.
- En el bucket queda `ebooks/libro-1.pdf` de prueba: reemplazarlo por el libro real.

### Publicar un producto

1. Subir el archivo a R2 (*R2 → flavia-material → Upload*) con la ruta indicada en `catalogo.json`
   (por ejemplo `ebooks/libro-1.pdf` o `masterclass/masterclass.mp4`).
2. En `catalogo.json`: completar `titulo` y `precio` (en pesos) y poner `"disponible": true`.
3. En `libros.html`: completar título, descripción y portada de la tarjeta.
4. Hacer commit y push: al publicarse, el sitio muestra el precio y el botón "Comprar".

Mientras `disponible` sea `false`, el libro muestra "Próximamente" y la masterclass solo la lista de espera.

## Tareas frecuentes

- **Activar la cuenta regresiva:** completar `data-fecha` en `masterclass.html`
  (formato `2026-12-01T19:00:00-03:00`).
- **Cargar un libro:** editar su `<article class="libro">` en `libros.html`
  (título, formato, descripción, precio, portada y texto del mensaje de WhatsApp).
- **Después de cambiar CSS o JS:** subir el número `?v=` en los `<link>` y `<script>`
  de las páginas para que los navegadores tomen la versión nueva.

## Diseño y desarrollo

Matías González.
