/* MV — ViewModel de la pagina de Login (adaptado a tu proyecto).
   Script clasico, como MV/inicio.js y MV/catalogo.js: no es un modulo,
   usa los observables de MV/motor.js y carga M/auth.model.js con
   import() dinamico.

   Supuestos sobre tu V/login.html (los mismos nombres que usaba tu
   AuthRepository de localStorage en M/modelo.js):
   - <form data-bind="submit: iniciarSesion">
   - <input data-bind="value: email"> y <input data-bind="value: password">
   - <p data-bind="show: hayError, text: error"></p>
   - <button data-bind="disabled: cargando">Entrar</button>
   Si tus campos se llaman distinto, cambia solo los nombres de los
   observables; la logica no cambia.

   Como se conecta en V/login.html (despues de motor.js y navbar.js):
     <script src="../M/modelo.js"></script>
     <script src="../MV/motor.js"></script>
     <script src="../MV/navbar.js"></script>
     <script src="../MV/login.js"></script>
     <script src="../MV/app.js"></script>
   Y en MV/app.js (o al final de login.html) se aplica con:
     Motor.aplicar(new LoginViewModel());

   Al entrar, redirige a index.html. Cambia esa linea si tu inicio
   se llama distinto.
*/

class LoginViewModel {
  constructor() {
    if (typeof AuthRepository !== "undefined" && AuthRepository.usuarioActual()) {
      window.location.href = "index.html";
      return;
    }

    this.email = observable("");
    this.password = observable("");
    this.error = observable("");
    this.cargando = observable(false);
    this.hayError = computed(() => this.error.get().length > 0);
    this.esRegistro = computed(() => false);
    this.sinRegistro = computed(() => true);
    this.titulo = computed(() => "Iniciar sesion");
    this.textoBoton = computed(() => this.cargando.get() ? "Entrando..." : "Entrar");
  }

  enviar() {
    return this.iniciarSesion();
  }

  async iniciarSesion() {
    this.error.set("");
    this.cargando.set(true);
    try {
      // import() dinamico: este archivo es un script clasico, no un modulo.
      // La ruta se resuelve desde V/login.html, por eso es ../M/...
      const auth = await import("../M/auth.model.js");
      const perfil = await auth.iniciarSesion(this.email.get(), this.password.get());
      // perfil trae { uid, email, username, displayName, role, ... }.
      // Si es admin, role === "admin" (tu cuenta ya lo tiene).
      window.location.href = "index.html";
      return perfil;
    } catch (e) {
      // Los errores ya vienen en espanol desde M/auth.model.js
      // ("Correo o contrasena incorrectos.", etc.).
      this.error.set(e.message || "No se pudo iniciar sesion.");
    } finally {
      this.cargando.set(false);
    }
  }
}

// Por si MV/app.js lo busca como global.
window.LoginViewModel = LoginViewModel;
