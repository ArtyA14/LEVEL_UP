/* MV — Arranque de cada pagina.
   Lee data-page del body, inyecta la barra de navegacion
   y conecta el ViewModel de esa pagina con el HTML de #app */

document.addEventListener("DOMContentLoaded", async function () {
  const pagina = document.body.dataset.page || "inicio";

  if (window.AuthListo) {
    try {
      await window.AuthListo;
    } catch (error) {
      console.error("No se pudo inicializar Firebase Auth", error);
    }
  }

  const contenedorNav = document.getElementById("navbar");
  if (contenedorNav) {
    contenedorNav.innerHTML = crearPlantillaNavbar();
    Motor.aplicar(new NavBarViewModel(pagina), contenedorNav);
  }

  const creadores = {
    inicio: function () { return new InicioViewModel(); },
    catalogo: function () { return new CatalogoViewModel(); },
    login: function () { return new LoginViewModel(); },
    registro: function () { return new RegistroViewModel(); },
    onboarding: function () { return new OnboardingViewModel(); },
    cuenta: function () { return new CuentaViewModel(); },
    admin: function () { return new AdminViewModel(); }
  };

  const app = document.getElementById("app");
  if (app && creadores[pagina]) {
    Motor.aplicar(creadores[pagina](), app);
  }
});
