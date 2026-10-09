/* MV — ViewModel de la pagina de Cuenta (perfil del usuario con sesion). */

class CuentaViewModel {
  constructor() {
    const usuario = AuthRepository.usuarioActual();

    if (!usuario) {
      window.location.href = "login.html";
      return;
    }

    this.nombre = usuario.nombre;
    this.email = usuario.email;
    this.inicial = usuario.nombre.charAt(0).toUpperCase();
    this.totalJuegos = GameRepository.obtenerTodos().length;
  }

  cerrarSesion() {
    AuthRepository.cerrarSesion();
    window.location.href = "index.html";
  }
}
