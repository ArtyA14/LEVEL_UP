/* MV — ViewModel del Catalogo.
   Maneja el buscador por nombre y los filtros por plataforma y genero. */

class CatalogoViewModel {
  constructor() {
    this.todos = GameRepository.obtenerTodos();

    this.query = observable("");
    this.plataforma = observable("Todas"); 
    this.genero = observable("Todos");
    this.mensaje = observable("");

    this.plataformas = ["Todas"].concat(this._valoresUnicos("plataforma"));
    this.generos = ["Todos"].concat(this._valoresUnicos("genero"));

    this.resultados = computed(() => this._filtrar());
    this.resumen = computed(() => this.resultados.get().length + " juegos encontrados");
    this.sinResultados = computed(() => this.resultados.get().length === 0);
    this.hayMensaje = computed(() => this.mensaje.get().length > 0);
  }

  _valoresUnicos(campo) {
    const vistos = [];
    this.todos.forEach((juego) => {
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

    return this.todos.filter((juego) =>
      (texto === "" || juego.titulo.toLowerCase().indexOf(texto) !== -1) &&
      (plataforma === "Todas" || juego.plataforma === plataforma) &&
      (genero === "Todos" || juego.genero === genero)
    );
  }

  limpiar() {
    this.query.set("");
    this.plataforma.set("Todas");
    this.genero.set("Todos");
  }

  comprar(juego) {
    if (!AuthRepository.usuarioActual()) {
      window.location.href = "login.html";
      return;
    }
    this.mensaje.set("Anadido (simulado): " + juego.titulo);
  }
}
