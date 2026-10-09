/* MV — Arranque de cada pagina.
   Lee data-page del body, inyecta la barra de navegacion
   y conecta el ViewModel de esa pagina con el HTML de #app. */

document.addEventListener("DOMContentLoaded", function () {
  const pagina = document.body.dataset.page || "inicio";

  const contenedorNav = document.getElementById("navbar");
  if (contenedorNav) {
    contenedorNav.innerHTML = crearPlantillaNavbar();
    Motor.aplicar(new NavBarViewModel(pagina), contenedorNav);
  }

  const creadores = {
    inicio: function () { return new InicioViewModel(); },
    catalogo: function () { return new CatalogoViewModel(); },
    login: function () { return new AuthViewModel("login"); },
    registro: function () { return new AuthViewModel("registro"); },
    cuenta: function () { return new CuentaViewModel(); }
  };

  const app = document.getElementById("app");
  if (app && creadores[pagina]) {
    Motor.aplicar(creadores[pagina](), app);
  }
});
