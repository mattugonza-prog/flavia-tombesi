// GET /api/estado — DIAGNÓSTICO TEMPORAL de la configuración de compras.
// Solo informa si cada pieza está presente (sí/no), nunca sus valores.
// Borrar este archivo cuando la configuración quede verificada.
import { mercadoPago } from '../_lib/util.js';

export async function onRequestGet({ env }) {
    let mercadoPagoAcepta = false;
    let estadoMercadoPago = null;
    if (env.MP_ACCESS_TOKEN) {
        const { ok, estado } = await mercadoPago(env, '/users/me');
        mercadoPagoAcepta = ok;
        estadoMercadoPago = estado;
    }
    return new Response(JSON.stringify({
        secretoMercadoPago: Boolean(env.MP_ACCESS_TOKEN),
        tokenDePrueba: Boolean(env.MP_ACCESS_TOKEN?.startsWith('TEST-')),
        mercadoPagoAcepta,
        estadoMercadoPago,
        secretoFirma: Boolean(env.FIRMA_SECRETA),
        bucketMaterial: Boolean(env.MATERIAL),
        kvAccesos: Boolean(env.ACCESOS),
        pdfLibro1: env.MATERIAL ? Boolean(await env.MATERIAL.head('ebooks/libro-1.pdf')) : false,
    }, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
