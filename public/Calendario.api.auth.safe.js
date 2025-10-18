// Calendario.api.auth.safe.js
// Renderiza el calendario SIEMPRE (aunque falle la API), y maneja token ausente/401.

const API_BASE = ""; // mismo origin
const EVENTS_URL = `${API_BASE}/events`;

// --- Helpers API ---
function getToken() {
  return localStorage.getItem("token");
}
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
async function apiGET(url) {
  const res = await fetch(url, { credentials: "include", headers: { ...authHeaders() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || "Error de red";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}
async function apiJSON(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || "Error de red";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// --- Estado y elementos ---
const Fecha = document.querySelector(".Fecha");
const ContenedorDias = document.querySelector(".Dias");
const izquierda = document.querySelector(".Irizquierda");
const derecha = document.querySelector(".Irderecha");
const btnFechaActual = document.querySelector(".BtnFechaActual");
const BtnEntradaFecha = document.querySelector(".BtnEntradaFecha");
const EntradaFecha = document.querySelector(".EntradaFecha");
const eventoDia = document.querySelector(".eventoDia");
const FechaEvento = document.querySelector(".FechaEvento");
const contenedoreventos = document.querySelector(".eventos");
const agregar_evento_btn = document.querySelector(".agregar-evento-btn");
const BtnCerrarSesion = document.querySelector(".BtnCerrarSesion");
const agregar_evento_wrapper = document.querySelector(".agregar-evento-wrapper");
const cerrar = document.querySelector(".cerrar");
const AgregarEventoBtn = document.querySelector(".AgregarEventoBtn");
const evento_titulo = document.querySelector(".evento-titulo");
const evento_hora = document.querySelector(".evento-hora");
const selectCategoria = document.getElementById('categorias');
const inputComentario = document.querySelector(".Comentarios-Eventos");

let FechaHoy = new Date();
let activeDia;
let mesActual = FechaHoy.getMonth();
let anioActual = FechaHoy.getFullYear();
let diaSeleccionado = null;
let mesSeleccionado = null;
let anioSeleccionado = null;


const mesesDelAño = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

let eventosMes = {};

const CATEGORY_EMOJI = {
  'cumpleaños': '🎂',
  'examen': '📝',
  'deportes': '🏅',
  'trabajo': '💼',
  'medico': '🩺',
  'viaje': '✈️',
  'otro': '📌',
};

// --- Render DÍAS (sin tocar API) ---
function CrearMes() {
  const primerDia = new Date(anioActual, mesActual, 1);
  const ultimoDia = new Date(anioActual, mesActual + 1, 0);
  const ultimodiaAnterior = new Date(anioActual, mesActual, 0);
  const DiasAnteriores = ultimodiaAnterior.getDate();
  const UltimaFecha = ultimoDia.getDate();
  const Dia = primerDia.getDay();
  const sigueitedias = 7 - ultimoDia.getDay() - 1;

  Fecha.innerHTML = `${mesesDelAño[mesActual]} ${anioActual}`;
  let dias = "";

  for (let i = Dia; i > 0; i--) {
    dias += `<div class="dia dia-previo">${DiasAnteriores - i + 1}</div>`;
  }

  for (let x = 1; x <= UltimaFecha; x++) {
    const esHoy =
      x === new Date().getDate() &&
      anioActual === new Date().getFullYear() &&
      mesActual === new Date().getMonth();

    const esDiaSeleccionado =
      x === diaSeleccionado &&
      mesActual === mesSeleccionado &&
      anioActual === anioSeleccionado;

    if (esDiaSeleccionado) {
      dias += `<div class="dia active">${x}</div>`;
    } else if (esHoy) {
      dias += `<div class="dia hoy">${x}</div>`;
    } else {
      dias += `<div class="dia">${x}</div>`;
    }
  }

  for (let j = 1; j <= sigueitedias; j++) {
    dias += `<div class="dia dia-siguiente">${j}</div>`;
  }

  ContenedorDias.innerHTML = dias;
  MarcararDiaSeleccionado();
  MarcarDiasConEventos();
}

// --- Marca los días que tienen eventos (si los hay) ---
function MarcarDiasConEventos() {
  const dias = ContenedorDias.querySelectorAll(".dia:not(.dia-previo):not(.dia-siguiente)");
  dias.forEach((dEl) => {
    const num = Number(dEl.textContent.trim());
    const hay = Array.isArray(eventosMes[num]) && eventosMes[num].length > 0;
    dEl.classList.toggle("evento", !!hay);
  });
}

// --- Carga eventos del mes desde la API (seguro) ---
async function cargarEventosMesSeguro() {
  try {
    // Fecha de inicio: lunes de la primera semana mostrada
    const primerDia = new Date(anioActual, mesActual, 1);
    const diaSemana = primerDia.getDay(); // 0 domingo, 1 lunes, etc.
    const inicio = new Date(primerDia);
    inicio.setDate(primerDia.getDate() - diaSemana);

    // Fecha de fin: domingo de la última semana mostrada
    const ultimoDia = new Date(anioActual, mesActual + 1, 0);
    const fin = new Date(ultimoDia);
    const faltantes = 6 - ultimoDia.getDay();
    fin.setDate(ultimoDia.getDate() + faltantes);

    const desde = inicio.toISOString().split("T")[0];
    const hasta = fin.toISOString().split("T")[0];

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No hay token, no se pueden cargar eventos");
      return;
    }

    const resp = await fetch(`${API_BASE}/events?desde=${desde}&hasta=${hasta}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resp.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return;
    }

    const data = await resp.json();
    eventos = data || [];

    MarcarDiasConEventos();
    if (diaSeleccionado) mostarEventos(diaSeleccionado);
  } catch (err) {
    console.error("Error al cargar eventos:", err);
  }
}


// --- Navegación de meses ---
function MesAnterior() {
  mesActual--;
  if (mesActual < 0) {
    mesActual = 11;
    anioActual--;
  }
  CrearMes();
  cargarEventosMesSeguro();
}

function MesSiguiente() {
  mesActual++;
  if (mesActual > 11) {
    mesActual = 0;
    anioActual++;
  }
  CrearMes();
  cargarEventosMesSeguro();
}

izquierda?.addEventListener("click", MesAnterior);
derecha?.addEventListener("click", MesSiguiente);

btnFechaActual?.addEventListener("click", () => {
  const hoy = new Date();
  FechaHoy = hoy;
  mesActual = hoy.getMonth();
  anioActual = hoy.getFullYear();
  diaSeleccionado = hoy.getDate();
  mesSeleccionado = mesActual;
  anioSeleccionado = anioActual;
  CrearMes();
  cargarEventosMesSeguro();
  SeleccionarYMarcarDia(diaSeleccionado);
});
EntradaFecha?.addEventListener("input", (e) => {
  EntradaFecha.value=EntradaFecha.value.replace(/ [^0-9/]/g, "");
  if (EntradaFecha.value.length === 2) EntradaFecha.value += "/";
  if (EntradaFecha.value.length > 7) EntradaFecha.value = EntradaFecha.value.slice(0, 7);
  if (e.inputType === "deleteContentBackward") {
    if (EntradaFecha.value.length === 3) EntradaFecha.value = EntradaFecha.value.slice(0, 2);
  }
});

BtnEntradaFecha?.addEventListener("click", () => {
  const arrfechaIngresada = EntradaFecha.value.split("/");
  if (arrfechaIngresada.length === 2) {
    if (arrfechaIngresada[0] > 0 && arrfechaIngresada[0] < 13 && arrfechaIngresada[1].length === 4) {
      mesActual = parseInt(arrfechaIngresada[0]) - 1;
      anioActual = parseInt(arrfechaIngresada[1]);
      CrearMes();
      cargarEventosMesSeguro();
      return;
    }
  } else {
    alert("Ingresa un formato correcto");
  }
});



AgregarEventoBtn?.addEventListener("click", () => {
  agregar_evento_wrapper.classList.add("active");
});
cerrar?.addEventListener("click", () => {
  agregar_evento_wrapper.classList.remove("active");
  evento_titulo.value = "";
  evento_hora.value = "";
});
document.addEventListener("click", (e) => {
  if (e.target !== AgregarEventoBtn && !agregar_evento_wrapper.contains(e.target)) {
    agregar_evento_wrapper.classList.remove("active");
    evento_titulo.value = "";
    evento_hora.value = "";
  }
});

evento_titulo?.addEventListener("input", () => {
  evento_titulo.value = evento_titulo.value.slice(0, 30);
});

evento_hora?.addEventListener("input", (e) => {
  evento_hora.value = evento_hora.value.replace(/[^0-9:]/g, "");
  if (evento_hora.value.length === 2) evento_hora.value += ":";
  if (evento_hora.value.length > 5) evento_hora.value = evento_hora.value.slice(0, 5);
  if (e.inputType === "deleteContentBackward") {
    if (evento_hora.value.length === 3) evento_hora.value = evento_hora.value.slice(0, 2);
  }
});

function InformacionDeHoy() {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
}

function MostrarSiHoyEsVisible() {
  const { y, m, d } = InformacionDeHoy();
  if (y === anioActual && m === mesActual) {
    activeDia = d;
    SeleccionarDia(d);
    mostarEventos(d);
    // marcar .active en el número de día correcto
    const dias = ContenedorDias.querySelectorAll(".dia:not(.dia-previo):not(.dia-siguiente)");
    dias.forEach(el => el.classList.remove("active"));
    const el = Array.from(dias).find(el => Number(el.textContent.trim()) === d);
    if (el) el.classList.add("active");
  }
}

function MarcararDiaSeleccionado() {
  const dias = document.querySelectorAll(".dia");
  dias.forEach((dia) => {
    dia.addEventListener("click", async (e) => {
      const number = Number(e.target.textContent.trim());

      if (e.target.classList.contains("dia-previo")) {
        MesAnterior();
        setTimeout(() => SeleccionarYMarcarDia(number), 100);
      } else if (e.target.classList.contains("dia-siguiente")) {
        MesSiguiente();
        setTimeout(() => SeleccionarYMarcarDia(number), 100);
      } else {
        SeleccionarYMarcarDia(number);
      }
    });
  });
}


function SeleccionarYMarcarDia(number) {
  activeDia = number;
  diaSeleccionado = number;
  mesSeleccionado = mesActual;
  anioSeleccionado = anioActual;
  SeleccionarDia(number);

  document.querySelectorAll(".dia").forEach((d) => d.classList.remove("active"));
  const el = Array.from(document.querySelectorAll(".dia"))
    .find((d) => Number(d.textContent.trim()) === number && !d.classList.contains("dia-previo") && !d.classList.contains("dia-siguiente"));
  if (el) el.classList.add("active");

  mostarEventos(number);
}


function SeleccionarDia(FechaNum) {
  const dia = new Date(anioActual, mesActual, FechaNum);
  diaSeleccionado = FechaNum;
  mesSeleccionado = mesActual;
  anioSeleccionado = anioActual;
  const NombreDia = dia.toLocaleDateString("es-ES", { weekday: "long" });
  eventoDia.innerHTML = NombreDia;
  FechaEvento.innerHTML = `${FechaNum} ${mesesDelAño[mesActual]} ${anioActual}`;
}



async function mostarEventos(FechaNum){
    const selectCategoria = document.getElementById("categorias");
  const list = eventosMes[Number(FechaNum)] || [];
  let eventos = "";
  list.forEach((ev) => {
    eventos += `<div class="evento" data-id="${ev.id}">
      <div class="evento-titulo">
        <div class="evento-categoria-emoji">${CATEGORY_EMOJI[ev.categoria] || '📌'}</div>
        <div class="TituloEvento">${ev.titulo}</div>
      </div>
      <div class="evento-hora">${ev.hora}</div>
    </div>`;
  });
  if (eventos === "") {
    eventos = `<div class="no-evento"><h3>No hay eventos para este día</h3></div>`;
  }
  contenedoreventos.innerHTML = eventos;
}

// Crear evento via API
agregar_evento_btn?.addEventListener("click", async () => {
  const TituloEvento = evento_titulo.value.trim();
  const HoraEvento = evento_hora.value.trim();
  const comentario = (inputComentario?.value || "").trim();

  // Validaciones básicas primero
  if (TituloEvento === "" || HoraEvento === "") {
    alert("Debe ingresar un titulo y una hora");
    return;
  }
  const parts = HoraEvento.split(":");
  if (parts.length !== 2 || Number(parts[0]) > 23 || Number(parts[1]) > 59) {
    alert("Formato de hora inválido");
    return;
  }

  // Día seleccionado
  const day = activeDia;
  if (!day) {
    alert("Seleccioná un día en el calendario");
    return;
  }

  // Armar fecha YYYY-MM-DD
  const yyyy = anioActual;
  const mm = String(mesActual + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Leer categoría del select (usar 'otro' si no eligieron)
  const selectCategoria = document.getElementById("categorias");
  const categoria = (selectCategoria?.value && selectCategoria.value !== "ninguna")
    ? selectCategoria.value
    : "otro";

  try {
    // Un solo POST, incluyendo category
   const payload = {
  title: TituloEvento,
  date: dateStr,
  time: HoraEvento,
  category: categoria,
};
if (comentario) payload.description = comentario; // ← opcional

const { event } = await apiJSON(EVENTS_URL, "POST", payload);

inputComentario.value = "";

    // Actualizar cache del mes (si guardás categoría, podés sumarla acá)
    if (!eventosMes[day]) eventosMes[day] = [];
    eventosMes[day].push({
      id: event.id,
      titulo: event.title,
      hora: event.time,
      categoria: event.category, // opcional si luego lo querés mostrar
    });

    // Reset UI
    agregar_evento_wrapper.classList.remove("active");
    evento_titulo.value = "";
    evento_hora.value = "";
    await mostarEventos(day);

    const diaActivo = document.querySelector(".dia.active");
    if (diaActivo && !diaActivo.classList.contains("evento")) {
      diaActivo.classList.add("evento");
    }
  } catch (err) {
    if (err.status === 401) {
      alert("Sesión expirada. Volvé a iniciar sesión.");
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return;
    }
    alert("Error creando evento: " + err.message);
  }
});
// Eliminar evento via API (click sobre tarjeta)
contenedoreventos?.addEventListener("click", async (e) => {
  const card = e.target.closest(".evento");
  if (!card) return;

  const id = Number(card.dataset.id);
  const titulo = card.querySelector(".TituloEvento")?.textContent || "";

  const confirmacion = confirm(`¿Eliminar "${titulo}"?`);
  if (!confirmacion) return;

  try {
    // DELETE al backend
    const data = await apiJSON(`${EVENTS_URL}/${id}`, "DELETE", {});
    
    // Mostrar mensaje que viene del backend
    alert(data.message); // Ej: 'Evento "X" fue resuelto y eliminado'

    // Actualizamos la lista local
    const list = eventosMes[activeDia] || [];
    const idx = list.findIndex(ev => ev.id === id);
    if (idx >= 0) list.splice(idx, 1);

    await mostarEventos(activeDia);

    // Limpiar clases si no hay eventos en el día
    const activeDiaelemento = document.querySelector(".dia.active");
    if (activeDiaelemento && (!eventosMes[activeDia] || eventosMes[activeDia].length === 0)) {
      activeDiaelemento.classList.remove("evento");
    }

  } catch (err) {
    if (err.status === 401) {
      alert("Sesión expirada. Volvé a iniciar sesión.");
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return;
    }
    alert("Error eliminando evento: " + err.message);
  }
});

// Cerrar sesión
BtnCerrarSesion?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
});

// Start: render primero y luego intenta cargar eventos
CrearMes();
cargarEventosMesSeguro();
