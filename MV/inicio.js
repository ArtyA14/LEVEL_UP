/* MV — ViewModel de la pagina de Inicio (adaptado a tu proyecto).
   No cambia tu index.html ni tus tarjetas.
   Solo cambia la fuente de `destacados`: primero pone tus 4 juegos
   locales para que no se vea vacío, y luego los reemplaza con los
   juegos de Firestore, mapeados a tus campos en español.

   Tu motor (motor.js) vuelve a pintar la lista solo cuando el
   observable cambia, por eso `destacados` ahora es observable([]),
   no un arreglo normal. Si fuera un arreglo normal, el cambio
   después de cargar Firestore no se vería.

   Requisitos en tu proyecto:
   - M/firebase-config.js : el archivo completo, con `export const db`
   - M/games.model.js     : el modelo de Firestore (ya actualizado)
   - Este archivo reemplaza a tu MV/inicio.js actual.
   - No hay que cambiar V/index.html: los scripts siguen siendo
     los mismos y en el mismo orden.
*/

function formatearPrecio(valor) {
  return "$" + Number(valor).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MXN";
}

function respaldo(texto) {
  return "https://placehold.co/300x420/1e1e2e/c7c9ff?text=" + encodeURIComponent(texto);
}

/* Firestore (ingles) -> tu modelo (espanol).
   Firestore: title, coverUrl, platforms[], genres[], price, ratingAvg...
   Tu vista:  titulo, imagen, plataforma, genero, precio, precioTexto...
   El descuento viene de `offers`: si hay oferta activa para el
   juego, se usa su discountPercent y su oldPrice. */
function mapearJuegoFirestore(juego, oferta) {
  const precio = oferta ? Number(oferta.newPrice) || Number(juego.price) || 0 : Number(juego.price) || 0;
  const precioOriginal = oferta ? Number(oferta.oldPrice) || precio : precio;
  const descuento = oferta ? Number(oferta.discountPercent) || 0 : 0;
  const plataformas = Array.isArray(juego.platforms) ? juego.platforms : ["PC"];
  const generos = Array.isArray(juego.genres) ? juego.genres : [];
  return {
    id: juego.id,
    titulo: juego.title,
    plataforma: plataformas.join(", "),
    plataformaCorta: plataformas.join(", "),
    genero: generos[0] || "",
    generos: generos,
    precio: precio,
    descuento: descuento,
    tieneDescuento: descuento > 0,
    descuentoTexto: "-" + descuento + "%",
    precioTexto: precio === 0 ? "Gratis" : formatearPrecio(precio),
    precioOriginalTexto: formatearPrecio(precioOriginal),
    imagen: juego.coverUrl || "",
    imagenRespaldo: respaldo(juego.title || "LEVEL_UP"),
    descripcion: juego.description || juego.shortDescription || "",
    ratingAvg: juego.ratingAvg ?? 0,
    ratingCount: juego.ratingCount ?? 0
  };
}

class InicioViewModel {
  constructor() {
    // 1. Observable vacío, para que el motor se suscriba y repinte al cambiar.
    this.destacados = observable([]);

    // 2. Respaldo inmediato: tus 4 juegos locales, por si Firestore tarda o falla.
    this.destacados.set(GameRepository.obtenerTodos().slice(0, 4));

    // 3. Cargar desde Firestore y reemplazar.
    this.cargarDesdeFirestore();
  }

  async cargarDesdeFirestore() {
    try {
      // import() dinámico: este archivo es un script clásico, no un módulo.
      // La ruta se resuelve desde V/index.html, por eso es ../M/...
      const juegosMod = await import("../M/games.model.js");
      const ofertasMod = await import("../M/offers.model.js");
      const juegos = await juegosMod.getGames({ max: 4 });
      if (!juegos || juegos.length === 0) {
        return; // se quedan los locales
      }
      let ofertasPorJuego = {};
      try {
        const ofertas = await ofertasMod.getActiveOffers(20);
        ofertas.forEach((o) => { ofertasPorJuego[o.gameId] = o; });
      } catch (e) {
        console.warn("No se pudieron cargar las ofertas, se muestran sin descuento", e);
      }
      this.destacados.set(juegos.map((j) => mapearJuegoFirestore(j, ofertasPorJuego[j.id])));
    } catch (error) {
      console.error("No se pudo cargar Destacados desde Firestore, se queda el catálogo local", error);
    }
  }
}

// Por si MV/app.js lo busca como global.
window.InicioViewModel = InicioViewModel;
