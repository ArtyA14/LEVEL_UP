/* MV — ViewModel del Catalogo (adaptado a tu proyecto).
   No cambia tu catalogo.html ni tus tarjetas.
   Solo cambia la fuente de `todos`: primero tus juegos locales,
   y luego los de Firestore, mapeados a tus campos en español.

   Cambio clave: en tu versión original `todos` era un arreglo
   normal, y los computed (`resultados`, `destacado`, `generos`)
   no se volvían a calcular si `todos` cambiaba. Por eso ahora
   `todos` es un observable, y todos los computed leen
   `this.todos.get()`. Cuando Firestore llega, el motor repinta
   el destacado, los filtros, los chips y los resultados.

   Requisitos en tu proyecto:
   - M/firebase-config.js : el archivo completo, con `export const db`
   - M/games.model.js     : el modelo de Firestore
   - Este archivo reemplaza a tu MV/catalogo.js actual.
   - No hay que cambiar V/catalogo.html.
*/

function formatearPrecioCatalogo(valor) {
  return "$" + Number(valor).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MXN";
}

function respaldoCatalogo(texto) {
  return "https://placehold.co/300x420/1e1e2e/c7c9ff?text=" + encodeURIComponent(texto);
}

/* Firestore (ingles) -> tu modelo (espanol).
   Firestore: title, coverUrl, platforms[], genres[], price...
   Tu vista:  titulo, imagen, plataforma, genero, precio, precioTexto...
   Nota: los juegos de Firestore no traen descuento en el documento
   (las ofertas van en la colección `offers`, aparte), así que
   descuento queda en 0 por ahora. El destacado será el primer
   juego, Hollow Knight. */
function mapearJuegoFirestore(juego) {
  const precio = Number(juego.price) || 0;
  const plataformas = Array.isArray(juego.platforms) ? juego.platforms : ["PC"];
  const generos = Array.isArray(juego.genres) ? juego.genres : [];
  return {
    id: juego.id,
    titulo: juego.title,
    plataforma: plataformas.join(", "),
    plataformaCorta: plataformas[0] || "PC",
    genero: generos[0] || "",
    generos: generos,
    precio: precio,
    descuento: 0,
    tieneDescuento: false,
    descuentoTexto: "-0%",
    precioTexto: precio === 0 ? "Gratis" : formatearPrecioCatalogo(precio),
    precioOriginalTexto: formatearPrecioCatalogo(precio),
    imagen: juego.coverUrl || "",
    imagenRespaldo: respaldoCatalogo(juego.title || "LEVEL_UP"),
    descripcion: juego.description || juego.shortDescription || "",
    ratingAvg: juego.ratingAvg ?? 0,
    ratingCount: juego.ratingCount ?? 0
  };
}

class CatalogoViewModel {
  constructor() {
    // 1. Observable, para que los computed se recalculen al cambiar.
    this.todos = observable(GameRepository.obtenerTodos());

    this.query = observable("");
    this.plataforma = observable("Todas");
    this.genero = observable("Todos");
    this.mensaje = observable("");

    this.plataformas = ["Todas", "PC", "Playstation 5", "Xbox Series X/S", "Nintendo Switch 1", "Nintendo Switch 2"];

    // 2. Géneros y chips ahora son computed, porque dependen de `todos`.
    this.generos = computed(() => ["Todos"].concat(this._valoresUnicos("genero")));

    this.chipsGenero = computed(() => this.generos.get().map((nombre) => ({
      nombre: nombre,
      clase: computed(() => "filtro-chip" + (this.genero.get() === nombre ? " filtro-chip--activo" : ""))
    })));

    this.destacado = computed(() => this._elegirDestacado());
    this.hayDestacado = computed(() => !!this.destacado.get());
    this.resultados = computed(() => this._filtrar());
    this.resumen = computed(() => this.resultados.get().length + " juegos encontrados");
    this.sinResultados = computed(() => this.resultados.get().length === 0);
    this.hayMensaje = computed(() => this.mensaje.get().length > 0);

    // 3. Cargar desde Firestore y reemplazar los locales.
    this.cargarDesdeFirestore();
  }

  async cargarDesdeFirestore() {
    try {
      const modulo = await import("../M/games.model.js");
      const juegos = await modulo.getGames({ max: 20 });
      if (!juegos || juegos.length === 0) {
        return; // se quedan los locales
      }
      this.todos.set(juegos.map(mapearJuegoFirestore));
    } catch (error) {
      console.error("No se pudo cargar el catálogo desde Firestore, se queda el catálogo local", error);
    }
  }

  _elegirDestacado() {
    const todos = this.todos.get();
    return todos.reduce((mejor, juego) => {
      if (!juego.tieneDescuento) {
        return mejor;
      }
      return !mejor || juego.descuento > mejor.descuento ? juego : mejor;
    }, null) || todos[0];
  }

  _valoresUnicos(campo) {
    const vistos = [];
    this.todos.get().forEach((juego) => {
      if (vistos.indexOf(juego[campo]) === -1) {
        vistos.push(juego[campo]);
      }
    });
    return vistos;
  }

  _filtrar() {
    const texto = this.query.get().trim().toLowerCase();
    const plataforma = this.plataforma.get();
    const genero = this.genero.get();

    return this.todos.get().filter((juego) =>
      (texto === "" || juego.titulo.toLowerCase().indexOf(texto) !== -1) &&
      (plataforma === "Todas" || juego.plataforma.indexOf(plataforma) !== -1) &&
      (genero === "Todos" || juego.genero === genero)
    );
  }

  limpiar() {
    this.query.set("");
    this.plataforma.set("Todas");
    this.genero.set("Todos");
  }

  elegirGenero(chip) {
    const nombre = chip && chip.nombre ? chip.nombre : "Todos";
    const repetido = this.genero.get() === nombre && nombre !== "Todos";
    this.genero.set(repetido ? "Todos" : nombre);
  }

  comprarDestacado() {
    const juego = this.destacado.get();
    if (juego) {
      this.comprar(juego);
    }
  }

  comprar(juego) {
    if (!AuthRepository.usuarioActual()) {
      window.location.href = "login.html";
      return;
    }
    this.mensaje.set("Anadido (simulado): " + juego.titulo);
  }
}

// Por si MV/app.js lo busca como global.
window.CatalogoViewModel = CatalogoViewModel;
