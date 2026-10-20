# Flavia Tombesi · Crianza y Mentalidad

Sitio web de Flavia Tombesi, docente y coach en Psicología Positiva: consultas online,
libros y masterclass. Sitio estático (HTML + Sass + JavaScript sin dependencias),
publicado en Vercel.

## Páginas

| Ruta | Contenido |
|---|---|
| `/` | Presentación, dos ejes (mentalidad y crianza), cómo es una consulta, quién soy |
| `/consultas` | Detalle de la consulta, para quién es, reserva por WhatsApp y preguntas frecuentes |
| `/libros` | Catálogo de libros (cada libro abre WhatsApp con el título) |
| `/masterclass` | Próximamente: cuenta regresiva y lista de espera por email (FormSubmit) |
| `/privacidad` | Política de privacidad |

## Desarrollo

```bash
npm install
npm run sass:watch   # recompila css/estilos.css al guardar
npm run dev          # sirve el sitio con URLs limpias (como en Vercel)
```

Los colores, tipografías y espaciados están en `sass/_variables.scss`.

## Tareas frecuentes

- **Activar la cuenta regresiva:** completar `data-fecha` en `masterclass.html`
  (formato `2026-12-01T19:00:00-03:00`).
- **Cargar un libro:** editar su `<article class="libro">` en `libros.html`
  (título, formato, descripción, precio, portada y texto del mensaje de WhatsApp).
- **Después de cambiar CSS o JS:** subir el número `?v=` en los `<link>` y `<script>`
  de las páginas para que los navegadores tomen la versión nueva.

## Diseño y desarrollo

Matías González.
