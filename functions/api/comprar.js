// POST /api/comprar — crea el pago en Mercado Pago y redirige al checkout.
// El precio sale de catalogo.json (servidor), nunca del navegador.
import { producto, mercadoPago } from '../_lib/util.js';

export async function onRequestPost({ request, env }) {
    const formulario = await request.formData();
    const item = producto(String(formulario.get('producto') || ''));
    const origen = new URL(request.url).origin;

    if (!item || !item.disponible || !(item.precio > 0)) {
        return Response.redirect(`${origen}/gracias?estado=no-disponible`, 303);
    }

    const { ok, datos } = await mercadoPago(env, '/checkout/preferences', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
            items: [{
                id: item.slug,
                title: item.titulo,
                quantity: 1,
                currency_id: 'ARS',
                unit_price: item.precio,
            }],
            external_reference: `${item.slug}:${crypto.randomUUID()}`,
            back_urls: {
                success: `${origen}/gracias`,
                pending: `${origen}/gracias`,
                failure: `${origen}/gracias`,
            },
            auto_return: 'approved',
            // Solo aprobado o rechazado, sin pagos en efectivo que quedan pendientes
            binary_mode: true,
            payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }] },
            statement_descriptor: 'FLAVIA TOMBESI',
        }),
    });

    if (!ok || !datos.init_point) {
        console.error('Mercado Pago no creó la preferencia', datos);
        return Response.redirect(`${origen}/gracias?estado=error`, 303);
    }
    return Response.redirect(datos.init_point, 303);
}

export function onRequestGet({ request }) {
    return Response.redirect(new URL('/libros', request.url).toString(), 303);
}
