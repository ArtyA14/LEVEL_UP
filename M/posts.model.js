import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, deleteDoc, query, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const postsRef = collection(db, "posts");

function fechaMillis(valor) {
  if (valor?.toMillis) return valor.toMillis();
  if (valor instanceof Date) return valor.getTime();
  return 0;
}

export async function getAllPosts(max = 100) {
  const snap = await getDocs(query(postsRef, limit(max)));
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  posts.sort((a, b) => fechaMillis(b.createdAt) - fechaMillis(a.createdAt));
  return posts;
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, "posts", postId));
}
