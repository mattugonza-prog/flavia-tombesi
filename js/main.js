// Flavia Tombesi · Crianza y Mentalidad: interacciones del sitio (sin dependencias)

// --- Menú mobile ---
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu-principal');

if (toggle && menu) {
    const cerrarMenu = () => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('abierto');
    };

    toggle.addEventListener('click', () => {
        const abierto = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!abierto));
        menu.classList.toggle('abierto', !abierto);
    });

    // Cerrar con Escape o al elegir un enlace
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && menu.classList.contains('abierto')) {
            cerrarMenu();
            toggle.focus();
        }
    });
    menu.querySelectorAll('a').forEach((enlace) => enlace.addEventListener('click', cerrarMenu));
}

// --- Sombra del header al scrollear ---
const header = document.querySelector('.header-principal');

if (header) {
    // Se agrupa en requestAnimationFrame para no forzar recálculos de layout en cada evento
    let pendiente = false;
    const actualizarHeader = () => {
        if (pendiente) return;
        pendiente = true;
        requestAnimationFrame(() => {
            header.classList.toggle('con-scroll', window.scrollY > 8);
            pendiente = false;
        });
    };
    actualizarHeader();
    window.addEventListener('scroll', actualizarHeader, { passive: true });
}

// --- Año actual en el footer ---
document.querySelectorAll('[data-anio]').forEach((elemento) => {
    elemento.textContent = new Date().getFullYear();
});

// --- Reserva de consulta → mensaje de WhatsApp ---
const WHATSAPP = '5493512068745';
const reserva = document.querySelector('[data-formulario-whatsapp]');

if (reserva) {
    reserva.addEventListener('submit', (evento) => {
        evento.preventDefault();
        if (!reserva.reportValidity()) return;

        const datos = new FormData(reserva);
        const lineas = [
            '¡Hola Flavia! Quiero reservar una consulta.',
            '',
            `Nombre: ${datos.get('nombre').trim()}`,
            `Tema: ${datos.get('tema')}`,
            datos.get('horario') ? `Horario preferido: ${datos.get('horario')}` : null,
            datos.get('mensaje').trim() ? `Mensaje: ${datos.get('mensaje').trim()}` : null,
        ].filter((linea) => linea !== null);

        window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lineas.join('\n'))}`, '_blank', 'noopener');
    });
}

// --- Formularios por email (FormSubmit) ---
// Envío tradicional: FormSubmit muestra un captcha y vuelve con ?<parámetro>=1.
// (La respuesta automática no funciona por AJAX ni sin captcha.)
document.querySelectorAll('[data-formulario-email]').forEach((formulario) => {
    const contenido = formulario.querySelector('.formulario__contenido');
    const exito = formulario.querySelector('.formulario__exito');
    const boton = formulario.querySelector('button[type="submit"]');
    const parametro = formulario.dataset.parametroExito || 'enviado';

    if (new URLSearchParams(window.location.search).get(parametro) === '1') {
        contenido.hidden = true;
        exito.hidden = false;
        exito.focus();
    }

    formulario.addEventListener('submit', (evento) => {
        if (!formulario.checkValidity()) return;
        // Evita envíos duplicados por doble clic
        if (boton.disabled) {
            evento.preventDefault();
            return;
        }
        boton.disabled = true;
        boton.textContent = 'Enviando…';
    });

    // Si se vuelve con el botón "atrás", el botón queda habilitado de nuevo
    window.addEventListener('pageshow', () => {
        boton.disabled = false;
        boton.textContent = boton.dataset.texto || 'Anotarme';
    });
    boton.dataset.texto = boton.textContent;
});

// --- Cuenta regresiva de la masterclass ---
// Se activa al completar data-fecha (formato ISO, ej: 2026-12-01T19:00:00-03:00)
const cuenta = document.querySelector('[data-cuenta-regresiva]');

if (cuenta && cuenta.dataset.fecha) {
    const objetivo = new Date(cuenta.dataset.fecha);
    const campos = {
        dias: cuenta.querySelector('[data-dias]'),
        horas: cuenta.querySelector('[data-horas]'),
        minutos: cuenta.querySelector('[data-minutos]'),
        segundos: cuenta.querySelector('[data-segundos]'),
    };
    const texto = cuenta.querySelector('[data-fecha-texto]');

    if (!Number.isNaN(objetivo.getTime())) {
        cuenta.classList.add('cuenta--activa');
        const zona = { timeZone: 'America/Argentina/Buenos_Aires' };
        const dia = objetivo.toLocaleDateString('es-AR', { ...zona, weekday: 'long', day: 'numeric', month: 'long' });
        const hora = objetivo.toLocaleTimeString('es-AR', { ...zona, hour: '2-digit', minute: '2-digit', hour12: false });
        texto.textContent = `Lanzamiento: ${dia}, ${hora} h (hora de Argentina)`;

        const dosDigitos = (n) => String(n).padStart(2, '0');
        const actualizar = () => {
            const restante = Math.max(0, objetivo - Date.now());
            const s = Math.floor(restante / 1000);
            campos.dias.textContent = Math.floor(s / 86400);
            campos.horas.textContent = dosDigitos(Math.floor((s % 86400) / 3600));
            campos.minutos.textContent = dosDigitos(Math.floor((s % 3600) / 60));
            campos.segundos.textContent = dosDigitos(s % 60);
            if (restante === 0) {
                clearInterval(intervalo);
                texto.textContent = '¡Ya está disponible!';
            }
        };
        const intervalo = setInterval(actualizar, 1000);
        actualizar();
    }
}

// --- Página /gracias: confirma el pago y entrega el material ---
const compra = document.querySelector('[data-compra]');

if (compra) {
    const params = new URLSearchParams(window.location.search);
    const idPago = params.get('payment_id') || params.get('collection_id');
    const ayuda = compra.querySelector('[data-ayuda]');

    const mostrar = (estado) => {
        compra.querySelectorAll('[data-estado]').forEach((bloque) => {
            bloque.hidden = bloque.dataset.estado !== estado;
        });
        ayuda.hidden = estado === 'verificando';
    };

    const problema = (titulo, texto) => {
        if (titulo) compra.querySelector('[data-problema-titulo]').textContent = titulo;
        if (texto) compra.querySelector('[data-problema-texto]').textContent = texto;
        mostrar('problema');
    };

    const fecha = (iso) => new Date(iso).toLocaleDateString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long',
    });

    const MENSAJES = {
        'no-disponible': ['Este material todavía no está a la venta', 'Escribime por WhatsApp y te aviso cuando esté disponible.'],
        error: ['No pudimos iniciar el pago', 'Probá de nuevo en unos minutos. Si el problema sigue, escribime por WhatsApp.'],
        rechazado: ['El pago fue rechazado', 'No se realizó ningún cobro. Podés intentarlo de nuevo con otro medio de pago.'],
        vencido: ['El acceso a este material venció', 'Escribime por WhatsApp con tu número de operación de Mercado Pago y lo vemos.'],
        limite: ['Se alcanzó el límite de accesos para esta compra', 'Escribime por WhatsApp con tu número de operación y te ayudo.'],
    };

    const entregar = (respuesta) => {
        compra.querySelector('[data-titulo]').textContent = respuesta.titulo;
        const descarga = compra.querySelector('[data-descarga]');
        const video = compra.querySelector('[data-video]');
        const esVideo = respuesta.tipo === 'video';

        descarga.hidden = esVideo;
        video.hidden = !esVideo;
        if (esVideo) video.src = respuesta.url;
        else descarga.href = respuesta.url;

        compra.querySelector('[data-nota]').textContent = esVideo
            ? `Podés volver a verla abriendo esta misma página hasta el ${fecha(respuesta.accesoHasta)}. Guardá el enlace.`
            : `Guardá el PDF en tu dispositivo. Si lo necesitás de nuevo, volvé a abrir esta página hasta el ${fecha(respuesta.accesoHasta)}.`;
        mostrar('aprobado');
    };

    const verificar = async () => {
        if (MENSAJES[params.get('estado')]) return problema(...MENSAJES[params.get('estado')]);
        if (!idPago || idPago === 'null') {
            if (params.get('status') === 'rejected' || params.get('status') === 'null') return problema(...MENSAJES.rechazado);
            return problema('No encontramos un pago para confirmar', 'Si ya pagaste, escribime por WhatsApp con el número de operación de Mercado Pago.');
        }

        try {
            const respuesta = await fetch(`/api/verificar?payment_id=${encodeURIComponent(idPago)}`).then((r) => r.json());
            if (respuesta.estado === 'aprobado') return entregar(respuesta);
            if (respuesta.estado === 'pendiente') return mostrar('pendiente');
            if (MENSAJES[respuesta.estado]) return problema(...MENSAJES[respuesta.estado]);
            problema();
        } catch {
            problema('No pudimos conectarnos', 'Revisá tu conexión y volvé a cargar esta página. Tu pago no se pierde.');
        }
    };

    verificar();
}
