// GET /api/verificar?payment_id=… — confirma el pago con Mercado Pago y,
// si está aprobado, devuelve un enlace firmado para descargar o ver el material.
import { producto, json, mercadoPago, firmar, vencimientoAcceso } from '../_lib/util.js';

const MAX_VERIFICACIONES = 10;      // Veces que un mismo pago puede generar enlaces
const VIGENCIA_ENLACE_MS = 6 * 60 * 60 * 1000;

export async function onRequestGet({ request, env }) {
    const idPago = new URL(request.url).searchParams.get('payment_id') || '';
    if (!/^\d{1,20}$/.test(idPago)) return json({ estado: 'invalido' }, 400);

    const { ok, estado, datos: pago } = await mercadoPago(env, `/v1/payments/${idPago}`);
    if (estado === 404) return json({ estado: 'invalido' }, 404);
    if (!ok) return json({ estado: 'error' }, 502);

    if (pago.status === 'in_process' || pago.status === 'pending') return json({ estado: 'pendiente' });
    if (pago.status !== 'approved') return json({ estado: 'rechazado' });

    // El producto sale de la referencia que generó el servidor al crear el pago.
    // No se compara con el precio actual: si cambia, quien ya pagó conserva su acceso.
    const item = producto(String(pago.external_reference || '').split(':')[0]);
    if (!item || pago.currency_id !== 'ARS') return json({ estado: 'invalido' }, 400);

    const accesoHasta = vencimientoAcceso(pago.date_approved, item.diasAcceso);
    if (Date.now() > accesoHasta) return json({ estado: 'vencido', titulo: item.titulo });

    // Límite de enlaces por pago, para que no se comparta indefinidamente
    if (env.ACCESOS) {
        const claveKv = `pago:${idPago}`;
        const usos = Number(await env.ACCESOS.get(claveKv)) || 0;
        if (usos >= MAX_VERIFICACIONES) return json({ estado: 'limite', titulo: item.titulo });
        const ttl = Math.max(60, Math.ceil((accesoHasta - Date.now()) / 1000));
        await env.ACCESOS.put(claveKv, String(usos + 1), { expirationTtl: ttl });
    }

    const exp = Math.min(Date.now() + VIGENCIA_ENLACE_MS, accesoHasta);
    const token = await firmar({ pago: idPago, producto: item.slug, exp }, env.FIRMA_SECRETA);
    return json({
        estado: 'aprobado',
        tipo: item.tipo,
        titulo: item.titulo,
        url: `/api/archivo?token=${encodeURIComponent(token)}`,
        accesoHasta: new Date(accesoHasta).toISOString(),
    });
}
