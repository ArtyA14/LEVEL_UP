// M/games.model.js — Model: solo habla con Firestore, nada de HTML aquí.

import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const gamesRef = collection(db, "games");

// Leer: lista de juegos, con filtros opcionales
// Sin orderBy en Firestore para no pedir índice compuesto:
// se ordena en JS por ratingAvg desc.
export async function getGames({ genre = null, onlyFeatured = false, max = 20 } = {}) {
  const conditions = [where("isActive", "==", true)];
  if (genre) {
    conditions.push(where("genres", "array-contains", genre));
  }
  if (onlyFeatured) {
    conditions.push(where("isFeatured", "==", true));
  }
  const q = query(gamesRef, ...conditions, limit(max));
  const snap = await getDocs(q);
  const games = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  games.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
  return games;
}

// Leer: un juego por id
export async function getGameById(id) {
  const snap = await getDoc(doc(db, "games", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Crear: solo admin (también hay que ponerlo en las Reglas de Firestore)
export async function createGame(data) {
  const ref = await addDoc(gamesRef, {
    ...data,
    ratingAvg: 0,
    ratingCount: 0,
    reviewCount: 0,
    ownersCount: 0,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

// Actualizar y borrar: solo admin
export async function updateGame(id, data) {
  await updateDoc(doc(db, "games", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteGame(id) {
  // Borrado lógico, para no perder reseñas y compras asociadas
  await updateDoc(doc(db, "games", id), { isActive: false, updatedAt: serverTimestamp() });
}
