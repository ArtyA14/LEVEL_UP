/* MV — ViewModel de Iniciar sesion y Crear cuenta.
   Se usa en login.html (modo "login") y registro.html (modo "registro"). */

class AuthViewModel {
  constructor(modo) {
    this.modo = modo;

    if (AuthRepository.usuarioActual()) {
      window.location.href = "cuenta.html";
      return;
    }

    this.nombre = observable("");
    this.email = observable("");
    this.password = observable("");
    this.error = observable("");

    this.esRegistro = computed(() => this.modo === "registro");
    this.sinRegistro = computed(() => this.modo !== "registro");
    this.hayError = computed(() => this.error.get().length > 0);
    this.titulo = computed(() => (this.modo === "registro" ? "Crear cuenta" : "Iniciar sesion"));
    this.textoBoton = computed(() => (this.modo === "registro" ? "Registrarme" : "Entrar"));
  }

  enviar() {
    this.error.set("");
    try {
      if (this.modo === "registro") {
        AuthRepository.registrar(this.nombre.get(), this.email.get(), this.password.get());
      } else {
        AuthRepository.iniciarSesion(this.email.get(), this.password.get());
      }
      window.location.href = "cuenta.html";
    } catch (error) {
      this.error.set(error.message);
    }
  }
}
