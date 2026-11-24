/* MV — Puente entre tu AuthRepository viejo y Firebase Auth.
   Script clasico, como MV/inicio.js: carga M/auth.model.js con
   import() dinamico y reemplaza window.AuthRepository (el de
   localStorage de M/modelo.js) por uno con los MISMO nombres de
   metodos, pero contra Firebase Auth.

   Por que hace falta: tu MV/catalogo.js tiene el guard
     if (!AuthRepository.usuarioActual()) { location = "login.html"; }
   Si AuthRepository sigue siendo el de localStorage, despues de
   entrar con Firebase ese guard siempre ve null y te regresa al
   login, aunque si tengas sesion. Con este puente, usuarioActual()
   lee la sesion de Firebase.

   Como se conecta: en cada V/*.html, DESPUES de M/modelo.js y
   MV/motor.js, ANTES del ViewModel de la pagina:
     <script src="../M/modelo.js"></script>
     <script src="../MV/motor.js"></script>
     <script src="../MV/auth-bridge.js"></script>
     <script src="../MV/catalogo.js"></script>
     <script src="../MV/app.js"></script>

   OJO — el orden al arrancar: al recargar, Firebase restaura la
   sesion de forma asincrona y usuarioActual() es null hasta que
   termina (normalmente < 1 s). Por eso MV/app.js debe esperar a
   window.AuthListo ANTES de crear el ViewModel de la pagina, por
   ejemplo:
     window.AuthListo.then(() => {
       Motor.aplicar(new CatalogoViewModel());
     });
   Si app.js crea el ViewModel sin esperar, el guard del catalogo
   te puede mandar al login aunque si tengas sesion.

   Nombres que conserva (los de tu M/modelo.js):
   - registrar(nombre, email, password) -> ahora es asincrono,
     devuelve una Promesa con el perfil; usalo con await.
   - iniciarSesion(email, password) -> ahora es asincrono, con await.
   - cerrarSesion() -> asincrono, con await.
   - usuarioActual() -> sigue siendo sincrono, lee la cache.
   El perfil nuevo trae username/displayName/role, no `nombre`:
   si tu navbar mostraba usuario.nombre, cambialo a
   usuario.username o usuario.displayName.
*/

(function () {
  // Promesa que se resuelve cuando el puente esta listo Y Firebase
  // ya dijo si hay sesion o no. MV/app.js la espera antes de
  // crear el ViewModel de la pagina.
  window.AuthListo = (async function () {
    try {
      const auth = await import("../M/auth.model.js");
      await auth.esperarSesion();
      window.AuthRepository = {
        registrar: function (nombre, email, password, extras) {
          return auth.registrarUsuario(Object.assign(
            { username: nombre, email: email, password: password },
            extras || {}
          ));
        },
        iniciarSesion: function (email, password) {
          return auth.iniciarSesion(email, password);
        },
        cerrarSesion: function () {
          return auth.cerrarSesion();
        },
        usuarioActual: function () {
          return auth.usuarioActual();
        },
        esAdmin: function (perfil) {
          return auth.esAdmin(perfil);
        }
      };
      return window.AuthRepository;
    } catch (error) {
      console.error("Firebase Auth no está disponible; se mantiene el AuthRepository local.", error);
      return window.AuthRepository;
    }
  })();
})();
