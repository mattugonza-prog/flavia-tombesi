// Utilidades compartidas por las funciones de compra (Cloudflare Pages Functions).
import catalogo from '../../catalogo.json';

export const MP_API_POR_DEFECTO = 'https://api.mercadopago.com';
const DIA_MS = 24 * 60 * 60 * 1000;

export function producto(slug) {
    return Object.hasOwn(catalogo, slug) ? { slug, ...catalogo[slug] } : null;
}

export function json(datos, estado = 200) {
    return new Response(JSON.stringify(datos), {
        status: estado,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
}

// Consulta a la API de Mercado Pago con el token de Flavia (secreto de Cloudflare)
export async function mercadoPago(env, ruta, opciones = {}) {
    const base = env.MP_API || MP_API_POR_DEFECTO;
    const respuesta = await fetch(base + ruta, {
        ...opciones,
        headers: {
            Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            ...opciones.headers,
        },
    });
    const datos = await respuesta.json().catch(() => ({}));
    return { ok: respuesta.ok, estado: respuesta.status, datos };
}

// Hasta cuándo puede descargar quien pagó en una fecha dada
export function vencimientoAcceso(fechaAprobacion, diasAcceso) {
    return new Date(fechaAprobacion).getTime() + diasAcceso * DIA_MS;
}

// --- Enlaces firmados (HMAC-SHA256) para entregar archivos privados ---
const codificador = new TextEncoder();

function aBase64Url(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function desdeBase64Url(texto) {
    const base64 = texto.replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function clave(secreto) {
    return crypto.subtle.importKey('raw', codificador.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function firmar(datos, secreto) {
    const cuerpo = aBase64Url(codificador.encode(JSON.stringify(datos)));
    const firma = await crypto.subtle.sign('HMAC', await clave(secreto), codificador.encode(cuerpo));
    return `${cuerpo}.${aBase64Url(firma)}`;
}

// Devuelve los datos si la firma es válida y no venció; si no, null
export async function verificarFirma(token, secreto) {
    const [cuerpo, firma] = String(token || '').split('.');
    if (!cuerpo || !firma) return null;
    try {
        // crypto.subtle.verify compara en tiempo constante
        const valida = await crypto.subtle.verify('HMAC', await clave(secreto), desdeBase64Url(firma), codificador.encode(cuerpo));
        if (!valida) return null;
        const datos = JSON.parse(new TextDecoder().decode(desdeBase64Url(cuerpo)));
        return datos.exp > Date.now() ? datos : null;
    } catch {
        return null;
    }
}
