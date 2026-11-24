/* MV — ViewModel del onboarding de generos favoritos.
   Se muestra una sola vez despues del registro (V/onboarding.html) y
   guarda la seleccion en users/{uid}.favoriteGenres con updateUserProfile.
   "Omitir por ahora" lleva al inicio sin guardar nada. */

const GENEROS_ONBOARDING = [
  { valor: "Accion", etiqueta: "Acción" },
  { valor: "Aventura", etiqueta: "Aventura" },
  { valor: "Carreras", etiqueta: "Carreras" },
  { valor: "RPG", etiqueta: "RPG" },
  { valor: "Sandbox", etiqueta: "Sandbox" },
  { valor: "Shooter", etiqueta: "Shooter" },
  { valor: "Simulacion", etiqueta: "Simulación" }
];

class OnboardingViewModel {
  constructor() {
    const usuario = typeof AuthRepository !== "undefined" ? AuthRepository.usuarioActual() : null;
    if (!usuario) {
      window.location.href = "login.html";
      return;
    }

    this.usuario = usuario;
    this.seleccionados = observable(
      Array.isArray(usuario.favoriteGenres) ? usuario.favoriteGenres.slice() : []
    );
    this.error = observable("");
    this.cargando = observable(false);
    this.hayError = computed(() => this.error.get().length > 0);
    this.textoGuardar = computed(() => this.cargando.get() ? "Guardando..." : "Guardar y continuar");
    this.resumen = computed(() => {
      const total = this.seleccionados.get().length;
      if (total === 0) {
        return "Aún no has elegido ningún género.";
      }
      return total === 1 ? "1 género seleccionado." : total + " géneros seleccionados.";
    });
    this.chips = computed(() => GENEROS_ONBOARDING.map((genero) => {
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
    this.cargando.set(true);
    try {
      const users = await import("../M/users.model.js");
      const favoritos = this.seleccionados.get().slice();
      await users.updateUserProfile(this.usuario.uid, { favoriteGenres: favoritos });
      this.usuario.favoriteGenres = favoritos;
      window.location.href = "index.html";
    } catch (e) {
      this.error.set("No se pudieron guardar tus géneros. Inténtalo de nuevo.");
    } finally {
      this.cargando.set(false);
    }
  }

  omitir() {
    window.location.href = "index.html";
  }
}

// Por si MV/app.js lo busca como global.
window.OnboardingViewModel = OnboardingViewModel;
