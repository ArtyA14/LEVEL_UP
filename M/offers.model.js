// M/offers.model.js — Model: solo habla con Firestore, nada de HTML aquí.
// Descuentos: offers/{offerId}
// El precio base siempre queda en games; la oferta es temporal y se activa
// o desactiva sin tocar el juego.

import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  query, where, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const offersRef = collection(db, "offers");

// Leer: ofertas activas. El filtro de fechas se hace en JS (no en la
// consulta) para no necesitar un índice compuesto en Firestore.
export async function getActiveOffers(max = 20) {
  const q = query(offersRef, where("isActive", "==", true), limit(max));
  const snap = await getDocs(q);
  const now = new Date();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(o => {
      const end = o.endDate?.toDate?.();
      return !end || end >= now;
    })
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
}

// Leer: la oferta activa de un juego, si tiene una
export async function getOfferForGame(gameId) {
  const q = query(
    offersRef,
    where("gameId", "==", gameId),
    where("isActive", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const offer = { id: snap.docs[0].id, ...snap.docs[0].data() };
  const end = offer.endDate?.toDate?.();
  if (end && end < new Date()) return null;
  return offer;
}

export async function getAllOffers() {
  const snap = await getDocs(offersRef);
  const ofertas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  ofertas.sort((a, b) => {
    const fa = a.createdAt?.toMillis?.() ?? 0;
    const fb = b.createdAt?.toMillis?.() ?? 0;
    return fb - fa;
  });
  return ofertas;
}

// Crear: solo admin (también hay que ponerlo en las Reglas).
// startDate y endDate son objetos Date de JS.
export async function createOffer({ gameId, gameTitle = "", coverUrl = "", oldPrice, newPrice, startDate, endDate }) {
  if (newPrice >= oldPrice) {
    throw new Error("El precio con descuento debe ser menor que el precio base.");
  }
  const discountPercent = Math.round((1 - newPrice / oldPrice) * 100);
  const ref = await addDoc(offersRef, {
    gameId, gameTitle, coverUrl, oldPrice, newPrice, discountPercent,
    startDate, endDate,
    isActive: true,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

// Actualizar y desactivar: solo admin
export async function updateOffer(id, data) {
  await updateDoc(doc(db, "offers", id), data);
}

export async function deactivateOffer(id) {
  await updateDoc(doc(db, "offers", id), { isActive: false });
}

export async function reactivarOffer(id) {
  await updateDoc(doc(db, "offers", id), { isActive: true });
}

// Helper sin Firestore: precio que se muestra en la vista.
// Devuelve { price, oldPrice, discountPercent } o solo { price } si no hay oferta.
export function getEffectivePrice(game, offer) {
  if (!offer) return { price: game.price };
  return {
    price: offer.newPrice,
    oldPrice: offer.oldPrice,
    discountPercent: offer.discountPercent
  };
}
