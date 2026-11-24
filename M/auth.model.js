// M/auth.model.js — Autenticación con Firebase Auth (correo/contraseña).
// Reemplaza al AuthRepository de localStorage de M/modelo.js.
//
// Cómo se usa (ver COMO-USAR-AUTH.md):
//   import { registrarUsuario, iniciarSesion, cerrarSesion,
//            observarSesion, esperarSesion, usuarioActual, esAdmin }
//     from "../M/auth.model.js";   // ruta desde V/ ; desde MV/ es "../M/..."
//
// Requisitos:
//   - M/firebase-config.js completo, con `export const auth` (ya lo tiene).
//   - En Firebase Console > Authentication > Método de inicio de sesión,
//     activado "Correo electrónico/contraseña".
//   - M/users.model.js (createUserProfile / getUserById), ya existe.
//
// La sesión persiste sola al recargar: Firebase Auth guarda la sesión
// en el navegador (persistencia local), no hay que guardar nada en
// localStorage a mano

import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { createUserProfile, getUserById } from "./users.model.js";

// ---------------------------------------------------------------------------
// Sesión en caché (para que el código que hoy usa AuthRepository.usuarioActual()
// de forma síncrona, como el guard de MV/catalogo.js, siga funcionando).
// OJO: al recargar, Firebase restaura la sesión de forma asíncrona; la caché
// es null hasta que eso termina (normalmente < 1 s). Para decidir rutas al
// arrancar la app, espera a esperarSesion() en MV/app.js (ver la guía).
// ---------------------------------------------------------------------------
let sesionCache = null;   // perfil completo { uid, email, username, role, ... } o null
let sesionLista = false;  // true cuando Firebase ya dijo si hay sesión o no
let _observadorListo = false;
let registroEnCurso = false;

function instalarObservador() {
  if (_observadorListo) return;
  _observadorListo = true;
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      sesionCache = null;
      sesionLista = true;
      return;
    }
    if (registroEnCurso) {
      sesionLista = true;
      return;
    }
    try {
      sesionCache = await cargarPerfil(user);
    } catch (error) {
      console.error("No se pudo cargar el perfil del usuario", error);
      sesionCache = null;
    } finally {
      sesionLista = true;
    }
  });
}
instalarObservador();

// ---------------------------------------------------------------------------
// Errores de Firebase traducidos a los mismos mensajes en español que ya
// mostraba el AuthRepository local, para que las vistas no cambien.
// ---------------------------------------------------------------------------
function traducirError(error) {
  const mensajes = {
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/invalid-email": "El correo no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/user-not-found": "Correo o contraseña incorrectos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    "auth/network-request-failed": "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
    "auth/operation-not-allowed":
      "El inicio con correo/contraseña no está activado en Firebase Console > Authentication.",
    "permission-denied": "No se pudo guardar tu perfil. Revisa las reglas de Firestore.",
    "unavailable": "Sin conexión con Firestore. Revisa tu internet e inténtalo de nuevo."
  };
  return new Error(mensajes[error.code] || error.message || "No se pudo completar la operación.");
}

const EDAD_MINIMA = 13;

// Calcula la edad en años a partir de una fecha "YYYY-MM-DD".
// Devuelve null si la fecha no es válida.
function calcularEdad(fechaISO) {
  const partes = String(fechaISO || "").split("-");
  if (partes.length !== 3) {
    return null;
  }
  const anio = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);
  if (!anio || !mes || !dia) {
    return null;
  }
  const nacimiento = new Date(anio, mes - 1, dia);
  if (
    isNaN(nacimiento.getTime()) ||
    nacimiento.getFullYear() !== anio ||
    nacimiento.getMonth() !== mes - 1 ||
    nacimiento.getDate() !== dia
  ) {
    return null;
  }
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();
  if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

function validarRegistro({ username, email, password, fechaNacimiento, pais, aceptaTerminos }) {
  username = (username || "").trim();
  email = (email || "").trim().toLowerCase();
  pais = (pais || "").trim();
  if (!username || !email || !password || !fechaNacimiento || !pais) {
    throw new Error("Completa todos los campos.");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("El correo no es válido.");
  }
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }
  const edad = calcularEdad(fechaNacimiento);
  if (edad === null || edad < 0) {
    throw new Error("La fecha de nacimiento no es válida.");
  }
  if (edad < EDAD_MINIMA) {
    throw new Error("Debes tener al menos 13 años para crear una cuenta.");
  }
  if (aceptaTerminos !== true) {
    throw new Error("Debes aceptar los Términos y la Política de privacidad.");
  }
  return { username, email, password, fechaNacimiento, pais };
}

// Carga el perfil de users/{uid}. Si el usuario de Auth no tiene documento
// (por ejemplo, se creó desde la consola), lo crea con role "user".
// Si el perfil YA existe, no se toca: así nunca se sobreescribe el role
// "admin" que ya tienes en tu documento.
// CORRECCIÓN: el username elegido al registrarse se pasa aquí; antes
// se perdía y el perfil quedaba con el prefijo del correo como username.
async function cargarPerfil(user, usernamePreferido, extras = {}) {
  let perfil = await getUserById(user.uid);
  if (!perfil) {
    const username = (usernamePreferido || "").trim()
      || (user.email || "").split("@")[0];
    await createUserProfile(user.uid, {
      username,
      displayName: username,
      email: user.email || "",
      ...extras
    });
    perfil = await getUserById(user.uid);
  }
  if (perfil) {
    return { uid: user.uid, email: user.email, ...perfil };
  }
  const username = (user.email || "").split("@")[0];
  return {
    uid: user.uid,
    email: user.email,
    username,
    displayName: username,
    role: "user"
  };
}

// ---------------------------------------------------------------------------
// API pública (todas asíncronas salvo usuarioActual, que lee la caché).
// ---------------------------------------------------------------------------

// Registro: crea el usuario en Firebase Auth y su documento en users/{uid}.
// Si ese uid ya tiene perfil (como tu admin), se conserva tal cual.
export async function registrarUsuario({ username, email, password, fechaNacimiento, pais, aceptaTerminos }) {
  const datos = validarRegistro({ username, email, password, fechaNacimiento, pais, aceptaTerminos });
  let cred = null;
  try {
    registroEnCurso = true;
    cred = await createUserWithEmailAndPassword(auth, datos.email, datos.password);
    const perfil = await cargarPerfil(cred.user, datos.username, {
      birthDate: datos.fechaNacimiento,
      country: datos.pais,
      termsAccepted: true
    });
    sesionCache = perfil;
    sesionLista = true;
    return perfil;
  } catch (error) {
    if (cred && cred.user) {
      try {
        await signOut(auth);
      } catch (_) {}
      sesionCache = null;
    }
    throw traducirError(error);
  } finally {
    registroEnCurso = false;
  }
}

// Login: entra con Firebase Auth y devuelve el perfil de users/{uid}
// (con su role, para que el admin sepa que lo es).
export async function iniciarSesion(email, password) {
  email = (email || "").trim().toLowerCase();
  if (!email || !password) {
    throw new Error("Completa todos los campos.");
  }
  let cred = null;
  try {
    cred = await signInWithEmailAndPassword(auth, email, password);
    const perfil = await cargarPerfil(cred.user);
    sesionCache = perfil;
    sesionLista = true;
    return perfil;
  } catch (error) {
    if (cred && cred.user) {
      try {
        await signOut(auth);
      } catch (_) {}
      sesionCache = null;
    }
    throw traducirError(error);
  }
}

export async function cerrarSesion() {
  await signOut(auth);
  sesionCache = null;
  sesionLista = true;
}

// Perfil de la sesión actual, o null si no hay sesión.
// Síncrono (lee la caché) para compatibilidad con el guard de catalogo.js,
// pero solo es fiable después de esperarSesion().
export function usuarioActual() {
  return sesionCache;
}

export function sesionEstaLista() {
  return sesionLista;
}

// Promesa que se resuelve con el perfil (o null) cuando Firebase termina
// de restaurar la sesión al cargar la página. Úsala en MV/app.js antes
// de decidir si mostrar login o el contenido.
export function esperarSesion() {
  if (sesionLista) return Promise.resolve(sesionCache);
  return new Promise((resolve) => {
    const desuscribir = onAuthStateChanged(auth, async (user) => {
      desuscribir();
      if (!user) {
        sesionCache = null;
        sesionLista = true;
        resolve(null);
        return;
      }
      try {
        const perfil = await cargarPerfil(user);
        sesionCache = perfil;
        resolve(perfil);
      } catch (error) {
        console.error("No se pudo cargar el perfil al restaurar la sesión", error);
        resolve(null);
      } finally {
        sesionLista = true;
      }
    });
  });
}

// Llama a `callback(perfil | null)` cada vez que cambia la sesión
// (login, logout, o restauración al recargar). Ideal para el navbar:
// mostrar el nombre del usuario o el botón de login.
export function observarSesion(callback) {
  return onAuthStateChanged(auth, async (user) => {
    let perfil = null;
    if (user && !registroEnCurso) {
      try {
        perfil = await cargarPerfil(user);
      } catch (error) {
        console.error("No se pudo cargar el perfil del usuario", error);
      }
    } else if (user) {
      perfil = sesionCache;
    }
    sesionCache = perfil;
    sesionLista = true;
    callback(perfil);
  });
}

export function esAdmin(perfil) {
  return !!perfil && perfil.role === "admin";
}
