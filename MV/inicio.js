/* MV — ViewModel de la pagina de Inicio. */

class InicioViewModel {
  constructor() {
    this.destacados = GameRepository.obtenerTodos().slice(0, 4);
  }
}
