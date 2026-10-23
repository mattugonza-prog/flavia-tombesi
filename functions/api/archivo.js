// GET /api/archivo?token=… — entrega el PDF o el video desde R2 (almacenamiento privado).
// Admite pedidos parciales (Range) para que el video se pueda reproducir y adelantar.
import { producto, verificarFirma } from '../_lib/util.js';

const TIPOS = { pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm', epub: 'application/epub+zip' };

function nombreArchivo(item) {
    const extension = item.archivo.split('.').pop();
    const base = item.titulo.normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    return `${base || item.slug}.${extension}`;
}

export async function onRequestGet({ request, env }) {
    const token = new URL(request.url).searchParams.get('token');
    const datos = await verificarFirma(token, env.FIRMA_SECRETA);
    const item = datos && producto(datos.producto);
    if (!item) return new Response('El enlace no es válido o ya venció.', { status: 403 });

    const pideRango = request.headers.has('range');
    let objeto;
    try {
        objeto = await env.MATERIAL.get(item.archivo, pideRango ? { range: request.headers } : {});
    } catch {
        return new Response('Rango no válido.', { status: 416 });
    }
    if (!objeto) return new Response('El material todavía no está cargado.', { status: 404 });

    const extension = item.archivo.split('.').pop().toLowerCase();
    const headers = new Headers({
        'Content-Type': TIPOS[extension] || 'application/octet-stream',
        'Cache-Control': 'private, no-store',
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `${item.tipo === 'video' ? 'inline' : 'attachment'}; filename="${nombreArchivo(item)}"`,
        'X-Robots-Tag': 'noindex',
    });

    if (pideRango && objeto.range) {
        // R2 informa el rango como { offset, length } o, para "los últimos N bytes", como { suffix }
        const { offset, length, suffix } = objeto.range;
        const inicio = suffix !== undefined ? Math.max(0, objeto.size - suffix) : (offset ?? 0);
        const largo = Math.min(suffix ?? length ?? objeto.size - inicio, objeto.size - inicio);
        if (inicio >= objeto.size || largo <= 0) {
            return new Response('Rango no válido.', { status: 416, headers: { 'Content-Range': `bytes */${objeto.size}` } });
        }
        headers.set('Content-Range', `bytes ${inicio}-${inicio + largo - 1}/${objeto.size}`);
        headers.set('Content-Length', String(largo));
        return new Response(objeto.body, { status: 206, headers });
    }
    headers.set('Content-Length', String(objeto.size));
    return new Response(objeto.body, { headers });
}
