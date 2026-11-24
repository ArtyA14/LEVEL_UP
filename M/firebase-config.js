// M/firebase-config.js — TEMPORAL (Level Up Temp)
// Proyecto temporal: level-up-temp-d5f8b, cuenta jumilinsecto@gmail.com
// Para usarlo: guarda tu firebase-config.js viejo y reemplázalo por este
// archivo renombrado a firebase-config.js. Cuando se resuelva la apelación,
// vuelve al config de level-up-41f05.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZ1yMxOqQw7LSalyPqTe1q1SYEydsimTY",
  authDomain: "level-up-41f05.firebaseapp.com",
  projectId: "level-up-41f05",
  storageBucket: "level-up-41f05.firebasestorage.app",
  messagingSenderId: "801450563792",
  appId: "1:801450563792:web:68ce0cc4522e6f1354a6d5",
  measurementId: "G-L6B0EZ28CS"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
