/* MV — ViewModel de la barra de navegacion (se comparte en todas las paginas). */

class NavBarViewModel {
  constructor(paginaActual) {
    this.paginaActual = paginaActual;
    this.usuario = observable(AuthRepository.usuarioActual());

    this.haySesion = computed(() => !!this.usuario.get());
    this.sinSesion = computed(() => !this.usuario.get());
    this.nombreUsuario = computed(() => {
      const usuario = this.usuario.get();
      if (!usuario) {
        return "";
      }
      return usuario.displayName || usuario.username || usuario.email || "";
    });

    this.hayAdmin = computed(() => {
      const usuario = this.usuario.get();
      return !!usuario && usuario.role === "admin";
    });

    this.claseInicio = computed(() => "nav-link" + (this.paginaActual === "inicio" ? " activo" : ""));
    this.claseCatalogo = computed(() => "nav-link" + (this.paginaActual === "catalogo" ? " activo" : ""));
    this.claseAdmin = computed(() => "nav-link nav-link--admin" + (this.paginaActual === "admin" ? " activo" : ""));
  }

  async cerrarSesion() {
    try {
      await AuthRepository.cerrarSesion();
    } catch (error) {
      console.error("No se pudo cerrar la sesión", error);
    }
    this.usuario.set(null);
    window.location.href = "index.html";
  }
}

function crearPlantillaNavbar() {
  return '' +
    '<nav class="nav">' +
      '<a class="nav-marca" href="index.html">LEVEL_UP</a>' +
      '<div class="nav-enlaces">' +
        '<a data-bind="class: claseInicio" href="index.html">Inicio</a>' +
        '<a data-bind="class: claseCatalogo" href="catalogo.html">Catalogo</a>' +
        '<a data-bind="show: hayAdmin, class: claseAdmin" href="admin.html">Admin</a>' +
      '</div>' +
      '<div class="nav-cuenta">' +
        '<div class="nav-grupo" data-bind="show: sinSesion">' +
          '<a class="boton boton-suave" href="login.html">Iniciar sesion</a>' +
          '<a class="boton boton-primario" href="registro.html">Crear cuenta</a>' +
        '</div>' +
        '<div class="nav-grupo" data-bind="show: haySesion">' +
          '<a class="nav-usuario" href="cuenta.html">Hola, <span data-bind="text: nombreUsuario"></span></a>' +
          '<button class="boton boton-suave" data-bind="click: cerrarSesion">Salir</button>' +
        '</div>' +
      '</div>' +
    '</nav>';
}
