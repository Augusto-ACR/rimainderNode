// Calendario.api.js (autenticado con Bearer token) - sin LocalStorage de eventos
const API_BASE = ""; // mismo origin
const EVENTS_URL = `${API_BASE}/events`;

// --- Helpers API ---
function authHeaders() {
  const t = localStorage.getItem("token"); // se setea en el login
  return t ? { Authorization: `Bearer ${t}` } : {};
}
async function apiGET(url) {
  const res = await fetch(url, { credentials: "include", headers: { ...authHeaders() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Error de red");
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
  if (!res.ok) throw new Error(data?.message || "Error de red");
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
const MostrarEventos = document.querySelector(".MostrarEventos");
const BtnCerrarSesion = document.querySelector(".BtnCerrarSesion");
const agregar_evento_wrapper = document.querySelector(".agregar-evento-wrapper");
const cerrar = document.querySelector(".cerrar");
const AgregarEventoBtn = document.querySelector(".AgregarEventoBtn");
const evento_titulo = document.querySelector(".evento-titulo");
const evento_hora = document.querySelector(".evento-hora");

let FechaHoy = new Date();
let activeDia;
let mesActual = FechaHoy.getMonth();
let anioActual = FechaHoy.getFullYear();

const mesesDelAño = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

let eventosMes = {};

// --- Carga inicial de eventos ---
async function cargarEventosMes(year, month) {
  const { events } = await apiGET(`${EVENTS_URL}?year=${year}&month=${month+1}`);
  eventosMes = {};
  for (const ev of events) {
    const d = ev.day;
    if (!eventosMes[d]) eventosMes[d] = [];
    eventosMes[d].push({ id: ev.id, titulo: ev.title, hora: ev.time });
  }
}

// --- Render días ---
async function agregarDias() {
  await cargarEventosMes(anioActual, mesActual);

  const primerDia = new Date(anioActual, mesActual, 1);
  const ultimoDia = new Date(anioActual, mesActual + 1, 0);
  const ultimodiaAnterior = new Date(anioActual, mesActual, 0);
  const DiasAnteriores = ultimodiaAnterior.getDate();
  const UltimaFecha = ultimoDia.getDate();
  const Dia = primerDia.getDay();
  const sigueitedias = 7 - ultimoDia.getDay() - 1;

  Fecha.innerHTML = mesesDelAño[mesActual] + " " + anioActual;
  let dias = "";

  for (let i = Dia; i > 0; i--) {
    dias += `<div class=" dia dia-previo"> ${DiasAnteriores - i + 1} </div>`;
  }

  for (let x = 1; x <= UltimaFecha; x++) {
    const hayEventos = Array.isArray(eventosMes[x]) && eventosMes[x].length > 0;
    const esHoy = x === new Date().getDate() && anioActual===new Date().getFullYear() && mesActual === new Date().getMonth();

    if (esHoy) {
      SeleccionarDia(x);
      mostarEventos(x);
      dias += `<div class="dia acive hoy ${hayEventos ? "evento" : ""}"> ${x} </div>`;
    } else {
      dias += `<div class="dia ${hayEventos ? "evento" : ""}"> ${x} </div>`;
    }
  }

  for (let j = 1; j <= sigueitedias; j++) {
    dias += `<div class=" dia dia-siguiente"> ${j} </div>`;
  }

  ContenedorDias.innerHTML = dias;
  MarcararDiaSeleccionado();
}

function MesAnterior() {
  mesActual--;
  if (mesActual < 0) {
    mesActual = 11;
    anioActual--;
  }
  Fecha.innerHTML = mesesDelAño[mesActual] + " " + anioActual;
  agregarDias();
}

function MesSiguiente() {
  mesActual++;
  if (mesActual > 11) {
    mesActual = 0;
    anioActual++;
  }
  Fecha.innerHTML = mesesDelAño[mesActual] + " " + anioActual;
  agregarDias();
}

izquierda.addEventListener("click", MesAnterior);
derecha.addEventListener("click", MesSiguiente);

btnFechaActual.addEventListener("click", () => {
  FechaHoy = new Date();
  mesActual = FechaHoy.getMonth();
  anioActual = FechaHoy.getFullYear();
  agregarDias();
});

EntradaFecha.addEventListener("input", (e) => {
  EntradaFecha.value=EntradaFecha.value.replace(/ [^0-9/]/g, "");
  if (EntradaFecha.value.length === 2) EntradaFecha.value += "/";
  if (EntradaFecha.value.length > 7) EntradaFecha.value = EntradaFecha.value.slice(0, 7);
  if (e.inputType === "deleteContentBackward") {
    if (EntradaFecha.value.length === 3) EntradaFecha.value = EntradaFecha.value.slice(0, 2);
  }
});

BtnEntradaFecha.addEventListener("click", () => {
  const arrfechaIngresada = EntradaFecha.value.split("/");
  if (arrfechaIngresada.length === 2) {
    if (arrfechaIngresada[0] > 0 && arrfechaIngresada[0] < 13 && arrfechaIngresada[1].length === 4) {
      mesActual = parseInt(arrfechaIngresada[0]) - 1;
      anioActual = parseInt(arrfechaIngresada[1]);
      agregarDias();
      return;
    }
  } else {
    alert("Ingresa un formato correcto");
  }
});

AgregarEventoBtn.addEventListener("click", () => {
  agregar_evento_wrapper.classList.add("active");
});
cerrar.addEventListener("click", () => {
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

evento_titulo.addEventListener("input", () => {
  evento_titulo.value = evento_titulo.value.slice(0, 30);
});

evento_hora.addEventListener("input", (e) => {
  evento_hora.value = evento_hora.value.replace(/[^0-9:]/g, "");
  if (evento_hora.value.length === 2) evento_hora.value += ":";
  if (evento_hora.value.length > 5) evento_hora.value = evento_hora.value.slice(0, 5);
  if (e.inputType === "deleteContentBackward") {
    if (evento_hora.value.length === 3) evento_hora.value = evento_hora.value.slice(0, 2);
  }
});

function MarcararDiaSeleccionado(){
  const dias = document.querySelectorAll(".dia");
  dias.forEach((dia) => {
    dia.addEventListener("click", async (e) => {
      const number = Number(e.target.innerHTML.trim());
      activeDia = number;
      await mostarEventos(number);
      SeleccionarDia(number);

      dias.forEach((d) => d.classList.remove("acive"));

      if (e.target.classList.contains("dia-previo")) {
        MesAnterior();
        setTimeout(() => {
          const dias2 = document.querySelectorAll(".dia");
          dias2.forEach((d) => {
            if (!d.classList.contains("dia-previo") && Number(d.textContent.trim()) === number) {
              d.classList.add("acive");
            }
          });
        }, 100);
      } else if (e.target.classList.contains("dia-siguiente")) {
        MesSiguiente();
        setTimeout(() => {
          const dias2 = document.querySelectorAll(".dia");
          dias2.forEach((d) => {
            if (!d.classList.contains("dia-siguiente") && Number(d.textContent.trim()) === number) {
              d.classList.add("acive");
            }
          });
        }, 100);
      } else {
        e.target.classList.add("acive");
      }
    });
  });
}

function SeleccionarDia(FechaNum){
  const dia = new Date(anioActual, mesActual, FechaNum);
  const NombreDia = dia.toLocaleDateString('es-ES', { weekday: 'long' });
  eventoDia.innerHTML = NombreDia;
  FechaEvento.innerHTML = FechaNum + " " + mesesDelAño[mesActual] + " " + anioActual;
}

async function mostarEventos(FechaNum){
  const list = eventosMes[Number(FechaNum)] || [];
  let eventos = "";
  list.forEach((ev) => {
    eventos += `<div class="evento" data-id="\${ev.id}">
      <div class="evento-titulo">
        <ion-icon name="alert-circle-outline"></ion-icon>
        <div class="TituloEvento">\${ev.titulo}</div>
      </div>
      <div class="evento-hora">\${ev.hora}</div>
    </div>`;
  });
  if (eventos === "") {
    eventos = `<div class="no-evento"><h3>No hay eventos para este día</h3></div>`;
  }
  contenedoreventos.innerHTML = eventos;
}

// Crear evento via API
agregar_evento_btn.addEventListener("click", async () => {
  const TituloEvento = evento_titulo.value.trim();
  const HoraEvento = evento_hora.value.trim();

  if (TituloEvento === "" || HoraEvento === "") {
    alert("Debe ingresar un titulo y una hora");
    return;
  }
  const parts = HoraEvento.split(":");
  if (parts.length !== 2 || Number(parts[0]) > 23 || Number(parts[1]) > 59){
    alert("Formato de hora inválido");
    return;
  }

  const day = activeDia;
  if (!day) {
    alert("Seleccioná un día en el calendario");
    return;
  }
  const yyyy = anioActual;
  const mm = String(mesActual + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  try {
    const { event } = await apiJSON(EVENTS_URL, "POST", { title: TituloEvento, date: dateStr, time: HoraEvento });
    if (!eventosMes[day]) eventosMes[day] = [];
    eventosMes[day].push({ id: event.id, titulo: event.title, hora: event.time });

    agregar_evento_wrapper.classList.remove("active");
    evento_titulo.value = "";
    evento_hora.value = "";
    await mostarEventos(day);

    const muetraQueHayevento = document.querySelector(".dia.acive");
    if(muetraQueHayevento && !muetraQueHayevento.classList.contains("evento")){
      muetraQueHayevento.classList.add("evento");
    }
  } catch (err) {
    alert("Error creando evento: " + err.message);
  }
});

// Eliminar evento via API (click sobre tarjeta)
contenedoreventos.addEventListener("click", async (e) => {
  const card = e.target.closest(".evento");
  if (!card) return;
  const id = Number(card.dataset.id);
  const titulo = card.querySelector(".TituloEvento")?.textContent || "";
  const confirmacion = confirm(`¿Eliminar "${titulo}"?`);
  if (!confirmacion) return;

  try {
    await apiJSON(`${EVENTS_URL}/${id}`, "DELETE", {});
    const list = eventosMes[activeDia] || [];
    const idx = list.findIndex(ev => ev.id === id);
    if (idx >= 0) list.splice(idx, 1);
    await mostarEventos(activeDia);

    const activeDiaelemento = document.querySelector(".dia.acive");
    if (activeDiaelemento && (!eventosMes[activeDia] || eventosMes[activeDia].length === 0)) {
      activeDiaelemento.classList.remove("evento");
    }
  } catch (err) {
    alert("Error eliminando evento: " + err.message);
  }
});

// Cerrar sesión: elimina token y vuelve al login
BtnCerrarSesion.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
});

// Start
agregarDias();
