import { db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function userDoc(uid) {
  return doc(db, "users", uid);
}

export async function getUserById(uid) {
  const snap = await getDoc(userDoc(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, "users"));
  const usuarios = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  usuarios.sort((a, b) =>
    String(a.username || a.email || "").localeCompare(String(b.username || b.email || ""), "es")
  );
  return usuarios;
}

export async function setUserRole(uid, role) {
  if (role !== "user" && role !== "admin") {
    throw new Error("Rol no válido.");
  }
  await updateDoc(userDoc(uid), { role, updatedAt: serverTimestamp() });
}

export async function setUserActive(uid, isActive) {
  await updateDoc(userDoc(uid), { isActive: !!isActive, updatedAt: serverTimestamp() });
}

export async function createUserProfile(uid, datos = {}) {
  const username = (datos.username || "").trim();
  const perfil = {
    ...datos,
    username,
    displayName: datos.displayName || username,
    email: datos.email || "",
    photoURL: datos.photoURL || "",
    bio: datos.bio || "",
    birthDate: datos.birthDate || "",
    country: datos.country || "",
    termsAccepted: datos.termsAccepted === true,
    termsAcceptedAt: datos.termsAccepted ? serverTimestamp() : null,
    role: datos.role || "user",
    level: datos.level || 1,
    xp: datos.xp || 0,
    favoriteGenres: datos.favoriteGenres || [],
    isActive: datos.isActive !== false,
    createdAt: datos.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(userDoc(uid), perfil, { merge: true });
  return getUserById(uid);
}

export async function updateUserProfile(uid, datos = {}) {
  await updateDoc(userDoc(uid), {
    ...datos,
    updatedAt: serverTimestamp()
  });
  return getUserById(uid);
}
