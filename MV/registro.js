/* MV — ViewModel de la pagina de Registro.
   Script clasico, como MV/inicio.js y MV/catalogo.js: no es un modulo,
   usa los observables de MV/motor.js y carga M/auth.model.js con
   import() dinamico.

   Campos del formulario (V/registro.html):
   - nombre, email, password, confirmarPassword
   - fechaNacimiento (date, edad minima 13 años)
   - pais (select)
   - aceptaTerminos (checkbox)
   Al registrarse redirige a onboarding.html para elegir generos favoritos. */

const EDAD_MINIMA_REGISTRO = 13;

function calcularEdadRegistro(fechaISO) {
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
  if (
    isNaN(nacimiento.getTime()) ||
    nacimiento.getFullYear() !== anio ||
    nacimiento.getMonth() !== mes - 1 ||
    nacimiento.getDate() !== dia
  ) {
    return null;
  }
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();
  if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

class RegistroViewModel {
  constructor() {
    if (typeof AuthRepository !== "undefined" && AuthRepository.usuarioActual()) {
      window.location.href = "index.html";
      return;
    }

    this.nombre = observable("");
    this.email = observable("");
    this.password = observable("");
    this.confirmarPassword = observable("");
    this.fechaNacimiento = observable("");
    this.pais = observable("");
    this.aceptaTerminos = observable(false);
    this.mostrarPassword = observable(false);
    this.error = observable("");
    this.cargando = observable(false);
    this.hayError = computed(() => this.error.get().length > 0);
    this.titulo = computed(() => "Crear cuenta");
    this.textoBoton = computed(() => this.cargando.get() ? "Creando cuenta..." : "Registrarme");
    this.tipoPassword = computed(() => this.mostrarPassword.get() ? "text" : "password");
    this.textoOjo = computed(() => this.mostrarPassword.get() ? "Ocultar" : "Mostrar");
  }

  alternarPassword() {
    this.mostrarPassword.set(!this.mostrarPassword.get());
  }

  enviar() {
    return this.registrarse();
  }

  validar() {
    const nombre = this.nombre.get().trim();
    const email = this.email.get().trim();
    const password = this.password.get();
    const confirmar = this.confirmarPassword.get();
    const fecha = this.fechaNacimiento.get();
    const pais = this.pais.get();

    if (!nombre || !email || !password || !confirmar || !fecha || !pais) {
      this.error.set("Completa todos los campos.");
      return false;
    }
    if (password !== confirmar) {
      this.error.set("Las contraseñas no coinciden.");
      return false;
    }
    const edad = calcularEdadRegistro(fecha);
    if (edad === null || edad < 0) {
      this.error.set("La fecha de nacimiento no es válida.");
      return false;
    }
    if (edad < EDAD_MINIMA_REGISTRO) {
      this.error.set("Debes tener al menos 13 años para crear una cuenta.");
      return false;
    }
    if (!this.aceptaTerminos.get()) {
      this.error.set("Debes aceptar los Términos y la Política de privacidad.");
      return false;
    }
    return true;
  }

  async registrarse() {
    this.error.set("");
    if (!this.validar()) {
      return;
    }
    this.cargando.set(true);
    try {
      // import() dinamico: este archivo es un script clasico, no un modulo.
      // La ruta se resuelve desde V/registro.html, por eso es ../M/...
      const auth = await import("../M/auth.model.js");
      await auth.registrarUsuario({
        username: this.nombre.get(),
        email: this.email.get(),
        password: this.password.get(),
        fechaNacimiento: this.fechaNacimiento.get(),
        pais: this.pais.get(),
        aceptaTerminos: this.aceptaTerminos.get()
      });
      // El modelo revalida todo; si algo falla lanza un error en espanol.
      window.location.href = "onboarding.html";
    } catch (e) {
      this.error.set(e.message || "No se pudo crear la cuenta.");
    } finally {
      this.cargando.set(false);
    }
  }
}

// Por si MV/app.js lo busca como global.
window.RegistroViewModel = RegistroViewModel;
