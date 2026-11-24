/* MV — ViewModel de la pagina de Cuenta (perfil del usuario con sesion).
   Muestra pais, edad y generos favoritos, y permite editarlos con
   updateUserProfile (M/users.model.js). */

const GENEROS_CUENTA = [
  { valor: "Accion", etiqueta: "Acción" },
  { valor: "Aventura", etiqueta: "Aventura" },
  { valor: "Carreras", etiqueta: "Carreras" },
  { valor: "RPG", etiqueta: "RPG" },
  { valor: "Sandbox", etiqueta: "Sandbox" },
  { valor: "Shooter", etiqueta: "Shooter" },
  { valor: "Simulacion", etiqueta: "Simulación" }
];

function calcularEdadCuenta(fechaISO) {
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
  if (isNaN(nacimiento.getTime())) {
    return null;
  }
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();
  if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad >= 0 ? edad : null;
}

class CuentaViewModel {
  constructor() {
    const usuario = AuthRepository.usuarioActual();

    if (!usuario) {
      window.location.href = "login.html";
      return;
    }

    this.usuario = usuario;
    const nombre = usuario.displayName || usuario.username || usuario.email || "";
    this.nombre = nombre;
    this.email = usuario.email || "";
    this.inicial = (nombre || "?").charAt(0).toUpperCase();
    this.totalJuegos = GameRepository.obtenerTodos().length;

    this.paisGuardado = observable(usuario.country || "");
    this.generosGuardados = observable(
      Array.isArray(usuario.favoriteGenres) ? usuario.favoriteGenres.slice() : []
    );

    this.paisTexto = computed(() => this.paisGuardado.get() || "Sin especificar");
    this.edadTexto = computed(() => {
      const edad = calcularEdadCuenta(this.usuario.birthDate);
      return edad === null ? "Sin especificar" : edad + " años";
    });
    this.generosTexto = computed(() => {
      const generos = this.generosGuardados.get();
      return generos.length ? generos.join(", ") : "Sin especificar";
    });

    this.editando = observable(false);
    this.guardando = observable(false);
    this.error = observable("");
    this.hayError = computed(() => this.error.get().length > 0);
    this.textoGuardar = computed(() => this.guardando.get() ? "Guardando..." : "Guardar cambios");
    this.paisEdicion = observable(usuario.country || "");
    this.seleccionados = observable(
      Array.isArray(usuario.favoriteGenres) ? usuario.favoriteGenres.slice() : []
    );
    this.chips = computed(() => GENEROS_CUENTA.map((genero) => {
      const vm = this;
      return {
        valor: genero.valor,
        etiqueta: genero.etiqueta,
        clase: computed(() =>
          "filtro-chip" + (vm.seleccionados.get().indexOf(genero.valor) !== -1 ? " filtro-chip--activo" : "")
        ),
        alternar: function () {
          vm.alternar(genero.valor);
        }
      };
    }));
  }

  abrirEdicion() {
    this.error.set("");
    this.paisEdicion.set(this.usuario.country || "");
    this.seleccionados.set(
      Array.isArray(this.usuario.favoriteGenres) ? this.usuario.favoriteGenres.slice() : []
    );
    this.editando.set(true);
  }

  cancelar() {
    this.error.set("");
    this.editando.set(false);
  }

  alternar(valor) {
    const actuales = this.seleccionados.get();
    const repetido = actuales.indexOf(valor) !== -1;
    this.seleccionados.set(
      repetido
        ? actuales.filter((genero) => genero !== valor)
        : actuales.concat(valor)
    );
  }

  async guardar() {
    this.error.set("");
    this.guardando.set(true);
    try {
      const users = await import("../M/users.model.js");
      const pais = this.paisEdicion.get();
      const favoritos = this.seleccionados.get().slice();
      await users.updateUserProfile(this.usuario.uid, {
        country: pais,
        favoriteGenres: favoritos
      });
      // Mantiene la cache de sesion (AuthRepository.usuarioActual) al dia.
      this.usuario.country = pais;
      this.usuario.favoriteGenres = favoritos;
      this.paisGuardado.set(pais);
      this.generosGuardados.set(favoritos);
      this.editando.set(false);
    } catch (e) {
      this.error.set("No se pudieron guardar los cambios. Inténtalo de nuevo.");
    } finally {
      this.guardando.set(false);
    }
  }

  async cerrarSesion() {
    try {
      await AuthRepository.cerrarSesion();
    } catch (error) {
      console.error("No se pudo cerrar la sesión", error);
    }
    window.location.href = "index.html";
  }
}

// Por si MV/app.js lo busca como global.
window.CuentaViewModel = CuentaViewModel;
