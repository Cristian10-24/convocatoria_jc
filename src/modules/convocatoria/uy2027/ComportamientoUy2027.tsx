"use client";
// Comportamiento de la landing de Uruguay 2027 (portado de landing-uy-2027/app.js). No dibuja nada: al montar,
// conecta los elementos que ya vienen del servidor dentro de [data-uy27]. Todo respeta "reducir movimiento": con esa
// opción el contenido aparece quieto y completo (el CSS ya lo deja así desde el primer pintado).
import { useEffect } from "react";

const $ = <T extends Element = HTMLElement>(sel: string, raiz: ParentNode = document) => raiz.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, raiz: ParentNode = document) => [...raiz.querySelectorAll<T>(sel)];

export default function ComportamientoUy2027({ finMs }: { finMs: number | null }) {
  useEffect(() => {
    const raiz = $("[data-uy27]");
    if (!raiz) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const limpiar: Array<() => void> = [];
    const en = <K extends keyof HTMLElementEventMap>(el: EventTarget, tipo: K | string, fn: (e: HTMLElementEventMap[K]) => void, opc?: AddEventListenerOptions) => {
      el.addEventListener(tipo, fn as EventListener, opc);
      limpiar.push(() => el.removeEventListener(tipo, fn as EventListener, opc));
    };

    // ---------- Aparición al hacer scroll ----------
    $$(".uy-escalonado", raiz).forEach((lista) => [...lista.children].forEach((hijo, i) => (hijo as HTMLElement).style.setProperty("--i", String(i))));
    const aparecen = $$(".uy-revelar, .uy-escalonado, .uy-linea, [data-al-ver], [data-contador]", raiz);
    const contar = (el: HTMLElement) => {
      const hasta = Number(el.dataset.contador);
      const t0 = performance.now();
      const paso = (t: number) => {
        const p = Math.min(1, (t - t0) / 1200);
        el.textContent = String(Math.round(hasta * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    };
    if (reducido || !("IntersectionObserver" in window)) aparecen.forEach((el) => el.classList.add("uy-visible"));
    else {
      const io = new IntersectionObserver((entradas) => entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        el.classList.add("uy-visible");
        if (el.dataset.contador) contar(el);
        io.unobserve(el);
      }), { rootMargin: "0px 0px -12% 0px" });
      aparecen.forEach((el) => io.observe(el));
      limpiar.push(() => io.disconnect());
    }

    // ---------- "Postulate" fijo abajo: aparece cuando el botón del inicio sale de pantalla ----------
    const pegajoso = $("[data-pegajoso]");
    const ctaHero = $("#cta-hero", raiz);
    if (pegajoso) {
      let pendiente = false;
      const calcular = () => {
        pendiente = false;
        const visible = ctaHero ? ctaHero.getBoundingClientRect().bottom <= 0 : true;
        pegajoso.classList.toggle("uy-pegajosoOculto", !visible);
        pegajoso.setAttribute("aria-hidden", String(!visible));
        pegajoso.inert = !visible;
      };
      const alMover = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(calcular); } };
      en(window, "scroll", alMover, { passive: true });
      en(window, "resize", alMover, { passive: true });
      calcular();
    }

    // ---------- Cuenta regresiva (hasta las 23:59 de Uruguay; la fecha viene de la configuración) ----------
    const caja = $("[data-cuenta]", raiz);
    if (caja && finMs) {
      const partes = Object.fromEntries($$("[data-cuenta-parte]", caja).map((el) => [el.dataset.cuentaParte!, el]));
      const poner = (el: HTMLElement | undefined, valor: number) => {
        if (!el) return;
        const t = String(valor).padStart(2, "0");
        if (el.textContent === t) return;
        el.textContent = t;
        if (!reducido) { el.classList.remove("uy-cambio"); void el.offsetWidth; el.classList.add("uy-cambio"); }
      };
      const tic = () => {
        const seg = Math.floor((finMs - Date.now()) / 1000);
        if (seg <= 0) { caja.hidden = true; return; }
        poner(partes.dias, Math.floor(seg / 86400));
        poner(partes.horas, Math.floor((seg % 86400) / 3600));
        poner(partes.min, Math.floor((seg % 3600) / 60));
        poner(partes.seg, seg % 60);
      };
      tic();
      const reloj = window.setInterval(tic, 1000);
      limpiar.push(() => clearInterval(reloj));
    }

    // ---------- Foto del inicio que se inclina con el mouse ----------
    const foto = $("[data-tilt]", raiz);
    if (foto && !reducido && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const brillo = document.createElement("span");
      brillo.className = "uy-tiltBrillo";
      brillo.setAttribute("aria-hidden", "true");
      foto.appendChild(brillo);
      en(foto, "pointermove", (e: PointerEvent) => {
        const r = foto.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        foto.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 14}deg) rotateY(${(x - 0.5) * 18}deg)`;
        brillo.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,.28), transparent 55%)`;
      });
      en(foto, "pointerleave", () => { foto.style.transform = ""; brillo.style.background = ""; });
      limpiar.push(() => brillo.remove());
    }

    // ---------- Ruta: intereses, línea de tiempo y tarjetas que se dan vuelta ----------
    const ruta = $("[data-ruta]", raiz);
    if (ruta) {
      const cursos = $$(".uy-curso", ruta), tramos = $$(".uy-tramo", ruta), intereses = $$(".uy-interes", ruta);
      const volteadas = new Set<string>();
      let activo: string | null = null, elegido: string | null = null, porPuntero = false;
      const pintar = () => {
        cursos.forEach((li) => {
          const n = li.dataset.curso!;
          const vuelta = volteadas.has(n) || activo === n || elegido === n;
          li.classList.toggle("uy-cursoVuelta", vuelta);
          li.classList.toggle("uy-cursoActivo", activo === n || elegido === n);
          li.classList.toggle("uy-cursoApagado", elegido !== null && elegido !== n);
          const boton = $(".uy-cursoGiro", li)!;
          const titulo = $(".uy-cursoTitulo", li)!.textContent;
          const semanas = $(".uy-cursoSemanas", li)!.textContent;
          boton.setAttribute("aria-pressed", String(vuelta));
          boton.setAttribute("aria-label", `${titulo}, ${semanas}. ${vuelta ? `Temas: ${boton.dataset.temas}` : "Tocá para ver qué aprendés"}`);
        });
        tramos.forEach((t) => t.classList.toggle("uy-tramoActivo", activo === t.dataset.curso));
      };
      const irA = (n: string, block: ScrollLogicalPosition = "nearest") => document.getElementById(`curso-${n}`)?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block });
      intereses.forEach((b) => en(b, "click", () => {
        const yaEstaba = b.getAttribute("aria-pressed") === "true";
        intereses.forEach((x) => x.setAttribute("aria-pressed", "false"));
        if (yaEstaba) { elegido = null; activo = null; }
        else { b.setAttribute("aria-pressed", "true"); elegido = b.dataset.curso!; activo = elegido; const e = elegido; setTimeout(() => irA(e), 60); }
        pintar();
      }));
      tramos.forEach((t) => {
        en(t, "mouseenter", () => { activo = t.dataset.curso!; pintar(); });
        en(t, "focus", () => { activo = t.dataset.curso!; pintar(); });
        en(t, "click", () => irA(t.dataset.curso!, "center"));
      });
      en(ruta, "mouseleave", () => { activo = elegido; pintar(); });
      cursos.forEach((li) => {
        const n = li.dataset.curso!;
        const boton = $(".uy-cursoGiro", li)!;
        en(boton, "pointerenter", (e: PointerEvent) => { if (e.pointerType === "mouse") { activo = n; pintar(); } });
        en(boton, "pointerleave", (e: PointerEvent) => { if (e.pointerType === "mouse") { activo = elegido; pintar(); } });
        en(boton, "pointerdown", () => { porPuntero = true; });
        en(boton, "focus", () => { if (!porPuntero) { activo = n; pintar(); } porPuntero = false; });
        en(boton, "blur", () => { activo = elegido; pintar(); });
        en(boton, "click", () => {
          if (volteadas.has(n)) volteadas.delete(n); else volteadas.add(n);
          // Con mouse la tarjeta ya está volteada por el hover: el clic la deja fija o la suelta.
          if (activo === n && !volteadas.has(n)) activo = null;
          pintar();
        });
      });
      pintar();
    }

    // ---------- Galería con visor (teclado, flechas y deslizar) ----------
    const items = $$("[data-galeria] .uy-galeriaItem", raiz);
    const visor = $("[data-visor]", raiz);
    if (items.length && visor) {
      const img = $<HTMLImageElement>("img", visor)!, pie = $("figcaption", visor)!;
      let actual = 0, origen: HTMLElement | null = null, inicioX: number | null = null, overflowPrevio = "";
      const mostrar = (i: number) => {
        actual = (i + items.length) % items.length;
        const b = items[actual]!, fuente = $<HTMLImageElement>("img", b)!;
        img.src = fuente.currentSrc || fuente.src;
        img.alt = fuente.alt;
        pie.textContent = `${b.dataset.pie} · ${actual + 1} / ${items.length}`;
        visor.setAttribute("aria-label", b.dataset.pie ?? "Foto ampliada");
      };
      const cerrar = () => { visor.hidden = true; document.body.style.overflow = overflowPrevio; origen?.focus(); };
      items.forEach((b, i) => en(b, "click", () => {
        origen = b; visor.hidden = false; overflowPrevio = document.body.style.overflow; document.body.style.overflow = "hidden";
        mostrar(i); $(".uy-visorCerrar", visor)?.focus();
      }));
      en($(".uy-visorCerrar", visor)!, "click", cerrar);
      en($(".uy-visorAnt", visor)!, "click", () => mostrar(actual - 1));
      en($(".uy-visorSig", visor)!, "click", () => mostrar(actual + 1));
      en(visor, "click", (e: MouseEvent) => { if (e.target === visor) cerrar(); });
      en(document, "keydown", (e: KeyboardEvent) => {
        if (visor.hidden) return;
        if (e.key === "Escape") cerrar();
        if (e.key === "ArrowRight") mostrar(actual + 1);
        if (e.key === "ArrowLeft") mostrar(actual - 1);
      });
      const figura = $(".uy-visorFigura", visor)!;
      en(figura, "pointerdown", (e: PointerEvent) => { inicioX = e.clientX; });
      en(figura, "pointerup", (e: PointerEvent) => {
        if (inicioX === null) return;
        const dx = e.clientX - inicioX;
        inicioX = null;
        if (dx < -60) mostrar(actual + 1); else if (dx > 60) mostrar(actual - 1);
      });
    }

    // ---------- Requisitos para marcar (medidor y confeti al completar) ----------
    const lista = $("[data-checklist]", raiz);
    if (lista) {
      const checks = $$<HTMLInputElement>("input[type=checkbox]", lista);
      const barra = $(".uy-medidorBarra i", lista)!, texto = $("[data-medidor-texto]", lista)!, cta = $("[data-cta-checklist]", lista)!;
      const confeti = (capa: HTMLElement) => {
        const colores = ["#F7972B", "#9aa3e0", "#1f9d6b", "#0C175D"];
        for (let i = 0; i < 26; i++) {
          const p = document.createElement("i");
          p.style.background = colores[i % colores.length]!;
          p.style.left = `${50 + (Math.random() - 0.5) * 30}%`;
          capa.appendChild(p);
          const x = (Math.random() - 0.5) * 320, alto = -140 - Math.random() * 120, giro = Math.random() * 540;
          p.animate([
            { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
            { transform: `translate(${x * 0.6}px, ${alto}px) rotate(${giro * 0.6}deg)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${x}px, 60px) rotate(${giro}deg)`, opacity: 0 },
          ], { duration: 1600 + Math.random() * 600, easing: "ease-out" }).onfinish = () => p.remove();
        }
      };
      const actualizar = () => {
        const n = checks.filter((c) => c.checked).length, t = checks.length, listo = n === t;
        barra.style.width = `${(n / t) * 100}%`;
        texto.textContent = listo ? "¡Cumplís con todo! Ya podés postularte." : `${n} de ${t} requisitos`;
        const antes = cta.classList.contains("uy-ctaListo");
        cta.classList.toggle("uy-ctaListo", listo);
        const capa = $(".uy-confeti", lista);
        if (listo && !antes && !reducido && capa) confeti(capa);
      };
      checks.forEach((c) => en(c, "change", actualizar));
      actualizar();
    }

    // ---------- Preguntas frecuentes (una abierta a la vez) ----------
    const faqs = $$("[data-faq] .uy-faq", raiz);
    faqs.forEach((faq) => {
      const boton = $("button", faq)!;
      en(boton, "click", () => {
        const abrir = !faq.classList.contains("uy-faqAbierta");
        faqs.forEach((f) => { f.classList.remove("uy-faqAbierta"); $("button", f)?.setAttribute("aria-expanded", "false"); });
        if (abrir) { faq.classList.add("uy-faqAbierta"); boton.setAttribute("aria-expanded", "true"); }
      });
    });

    // ---------- Testimonios: al tocar la miniatura, el video (youtube-nocookie) ----------
    $$("[data-video]", raiz).forEach((fig) => {
      const marco = $(".uy-videoMarco", fig), boton = $("[data-video-boton]", fig);
      if (!marco || !boton) return;
      en(boton, "click", () => {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${fig.dataset.video}?autoplay=1&rel=0`;
        iframe.title = `Testimonio de ${fig.dataset.nombre}`;
        iframe.allow = "autoplay; encrypted-media; picture-in-picture";
        iframe.allowFullscreen = true;
        boton.replaceWith(iframe);
      });
    });

    // ---------- Partículas del cierre (canvas; solo animan mientras se ven) ----------
    const canvas = $<HTMLCanvasElement>("[data-particulas]", raiz);
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const colores = ["#F7972B", "#9aa3e0", "#fff0de", "#ffffff"];
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      let ancho = 0, alto = 0, id = 0, visible = false;
      let ps: Array<{ x: number; y: number; vx: number; vy: number; r: number; c: string }> = [];
      const raton = { x: -9999, y: -9999 };
      const medir = () => {
        const r = canvas.getBoundingClientRect();
        ancho = r.width; alto = r.height;
        canvas.width = ancho * dpr; canvas.height = alto * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.min(ancho < 600 ? 28 : 48, Math.floor((ancho * alto) / 12000));
        ps = Array.from({ length: n }, () => ({ x: Math.random() * ancho, y: Math.random() * alto, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: 1 + Math.random() * 2.4, c: colores[Math.floor(Math.random() * colores.length)]! }));
      };
      const dibujar = () => {
        ctx.clearRect(0, 0, ancho, alto);
        for (const p of ps) {
          if (!reducido) {
            const dx = p.x - raton.x, dy = p.y - raton.y, d2 = dx * dx + dy * dy;
            if (d2 < 14400) { const f = (1 - Math.sqrt(d2) / 120) * 0.9; p.vx += (dx / 120) * f; p.vy += (dy / 120) * f; }
            p.vx = p.vx * 0.96 + (Math.random() - 0.5) * 0.03;
            p.vy = p.vy * 0.96 + (Math.random() - 0.5) * 0.03;
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > ancho) p.vx *= -1;
            if (p.y < 0 || p.y > alto) p.vy *= -1;
          }
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = p.c; ctx.fill();
        }
        for (let i = 0; i < ps.length; i++) for (let k = i + 1; k < ps.length; k++) {
          const a = ps[i]!, b = ps[k]!, dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 9025) {
            ctx.strokeStyle = `rgba(247, 151, 43, ${0.22 * (1 - Math.sqrt(d2) / 95)})`;
            ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (!reducido && visible && !document.hidden) id = requestAnimationFrame(dibujar);
      };
      medir(); dibujar();
      const io = new IntersectionObserver(([e]) => {
        visible = !!e?.isIntersecting; cancelAnimationFrame(id);
        if (visible) id = requestAnimationFrame(dibujar);
      });
      io.observe(canvas);
      const padre = canvas.parentElement!;
      en(padre, "pointermove", (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); raton.x = e.clientX - r.left; raton.y = e.clientY - r.top; });
      en(padre, "pointerleave", () => { raton.x = -9999; raton.y = -9999; });
      en(window, "resize", () => { medir(); dibujar(); });
      limpiar.push(() => { io.disconnect(); cancelAnimationFrame(id); });
    }

    return () => limpiar.forEach((f) => f());
  }, [finMs]);

  return null;
}
