const API_BASE = ""; // mismo origin
const LOGIN_URL = `${API_BASE}/auth/login`;
const REGISTER_URL = `${API_BASE}/auth/register`;
const RESET_PASS_URL = (id) => `${API_BASE}/users/${id}/reset-password`;

// ---------- DOM ----------
const btnLogin = document.getElementById("btnInicioSecion");
const btnRegistro = document.getElementById("btnRegistro");

const inputLoginUser = document.querySelector(".inicioSecion .UsuarioIngresado");
const inputLoginPass = document.querySelector(".inicioSecion .Contrasena");

const inputRegUser = document.querySelector(".registro .UsuarioIngresado");
const inputRegPass = document.querySelector(".registro .Contrasena1");
const inputRegChatId = document.querySelector(".registro .ChatClave");

const loginForm = document.querySelector(".inicioSecion");
const registroForm = document.querySelector(".registro");
const switchBtn = document.getElementById("switchBtn");
const switchText = document.getElementById("switchText");

// ---------- Cambiar vista ----------
switchBtn?.addEventListener("click", () => {
  loginForm.classList.toggle("active");
  registroForm.classList.toggle("active");

  if (loginForm.classList.contains("active")) {
    switchText.textContent = "¿No tenés cuenta?";
    switchBtn.textContent = "Registrarse";
  } else {
    switchText.textContent = "¿Ya tenés cuenta?";
    switchBtn.textContent = "Iniciar sesión";
  }
});

// ---------- Helper fetch ----------
async function doFetchJSON(url, method, bodyObj) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyObj),
    credentials: "include",
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");
  if (!res.ok) throw new Error(typeof data === "string" ? data : (data?.message || "Error"));
  return data;
}

// ---------- Login ----------
btnLogin?.addEventListener("click", async (e) => {
  e.preventDefault();
  const username = inputLoginUser.value.trim();
  const password = inputLoginPass.value;

  if (!username || !password) return alert("Ingresá usuario y contraseña");

  try {
    const data = await doFetchJSON(LOGIN_URL, "POST", { username, password });
    const token = data?.token || data?.access_token || data?.jwt || null;
    const user  = data?.user || data?.data || { username };
    if (token) localStorage.setItem("token", token);
    localStorage.setItem("usuarioingresado", user.username || username);
    alert(`Bienvenido, ${user.username || username}`);
    window.location.href = "Calendario.html";
  } catch (err) {
    alert("Error de login: " + err.message);
  }
});

// ---------- Registro ----------
btnRegistro?.addEventListener("click", async (e) => {
  e.preventDefault();
  const username = inputRegUser.value.trim();
  const password = inputRegPass.value;
  const chatId = inputRegChatId.value.trim();

  if (!username) return alert("Usuario requerido");
  if (password.length < 3) return alert("La contraseña debe tener mínimo 3 caracteres");
  if (!chatId) return alert("Clave del chat requerida");

  try {
    await doFetchJSON(REGISTER_URL, "POST", { username, password, chatId });
    alert("Registro correcto. Ahora iniciá sesión.");
    loginForm.classList.add("active");
    registroForm.classList.remove("active");
    switchText.textContent = "¿No tenés cuenta?";
    switchBtn.textContent = "Registrarse";
  } catch (err) {
    alert("Error de registro: " + err.message);
  }
});

// ---------- Olvidé mi contraseña ----------
document.getElementById("olvide")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const id = prompt("Ingresá tu ID de usuario (solo números):");
  if (!id || isNaN(Number(id))) return alert("ID inválido");

  const newPassword = prompt("Ingresá tu nueva contraseña (mínimo 3 caracteres):");
  if (!newPassword || newPassword.length < 3) return alert("La contraseña debe tener al menos 3 caracteres");

  try {
    await doFetchJSON(RESET_PASS_URL(id), "PUT", { newPassword });
    alert("Contraseña restablecida correctamente. Ahora podés iniciar sesión.");
    loginForm.classList.add("active");
    registroForm.classList.remove("active");
    switchText.textContent = "¿No tenés cuenta?";
    switchBtn.textContent = "Registrarse";
  } catch (err) {
    alert("Error al restablecer contraseña: " + err.message);
  }
});
