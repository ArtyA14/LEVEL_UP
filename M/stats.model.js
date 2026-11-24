import { db } from "./firebase-config.js";
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const statsRef = collection(db, "stats");
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function getGlobalStats() {
  const snap = await getDoc(doc(db, "stats", "global"));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getDailyStats(limit = 7) {
  const snap = await getDocs(statsRef);
  const dias = snap.docs
    .filter(d => PATRON_FECHA.test(d.id))
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  return dias.slice(0, limit);
}
