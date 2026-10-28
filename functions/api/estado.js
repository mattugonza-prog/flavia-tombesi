// GET /api/estado — DIAGNÓSTICO TEMPORAL: ¿el token es de una cuenta de prueba?
// No muestra ningún valor. Borrar después de verificar.
import { mercadoPago } from '../_lib/util.js';

export async function onRequestGet({ env }) {
    const { ok, datos } = await mercadoPago(env, '/users/me');
    return new Response(JSON.stringify({
        mercadoPagoAcepta: ok,
        cuentaDePrueba: String(datos.nickname || '').startsWith('TESTUSER'),
    }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
