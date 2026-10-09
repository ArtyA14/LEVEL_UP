/* M — Model
   Responsabilidad: los DATOS y el almacenamiento.
   Aqui viven los juegos, los usuarios y el guardado en localStorage.
   Este archivo NO toca el HTML: solo entrega y guarda informacion. */

(function () {
  const CLAVE_USUARIOS = "levelup.usuarios";
  const CLAVE_SESION = "levelup.sesion";

  /* ===== PORTADAS =====
     Las imagenes NO se guardan en el proyecto: se cargan por URL desde un
     repositorio de GitHub publicado con el CDN de jsDelivr.
     Formato de la URL:  https://cdn.jsdelivr.net/gh/USUARIO/REPO@RAMA/CARPETA/archivo
     Si cambias de repositorio, solo edita BASE_IMAGENES. */
  const BASE_IMAGENES = "https://cdn.jsdelivr.net/gh/ArtyA14/level-up-imagenes@main/portadas/";

  function portada(archivo) {
    return BASE_IMAGENES + archivo;
  }

  /* Respaldo por si una portada del repositorio no carga. */
  function respaldo(texto) {
    return "https://placehold.co/300x420/1e1e2e/c7c9ff?text=" + encodeURIComponent(texto);
  }

  /* ===== CATALOGO =====
     Agrega, quita o edita juegos en esta lista.
     Campos: id, titulo, plataforma, genero, precio, imagen, descripcion.
     - precio: numero en pesos mexicanos (MXN).
     - imagen: nombre del archivo dentro de BASE_IMAGENES (ej. "elden-ring.svg"). */
  const JUEGOS_SEMILLA = [
    {
      id: 1,
      titulo: "Elden Ring",
      plataforma: "PC",
      genero: "RPG",
      precio: 1399.00,
      imagen: portada("elden-ring.svg"),
      descripcion: "Rol de mundo abierto con combates exigentes y un mundo enorme por explorar."
    },
    {
      id: 2,
      titulo: "The Legend of Zelda: Tears of the Kingdom",
      plataforma: "Nintendo Switch",
      genero: "Aventura",
      precio: 1399.00,
      imagen: portada("zelda-tears-of-the-kingdom.svg"),
      descripcion: "Aventura de exploracion con construccion y libertad total para resolver retos."
    },
    {
      id: 3,
      titulo: "Cyberpunk 2077",
      plataforma: "PC",
      genero: "Accion",
      precio: 899.00,
      imagen: portada("cyberpunk-2077.svg"),
      descripcion: "Rol de accion en una ciudad futurista llena de misiones e historias."
    },
    {
      id: 4,
      titulo: "Baldur's Gate 3",
      plataforma: "PC",
      genero: "RPG",
      precio: 1399.00,
      imagen: portada("baldurs-gate-3.svg"),
      descripcion: "Rol por turnos basado en decisiones que cambian toda la historia."
    },
    {
      id: 5,
      titulo: "Hollow Knight",
      plataforma: "Nintendo Switch",
      genero: "Aventura",
      precio: 299.00,
      imagen: portada("hollow-knight.svg"),
      descripcion: "Metroidvania dibujado a mano con exploracion y jefes memorables."
    },
    {
      id: 6,
      titulo: "Stardew Valley",
      plataforma: "PC",
      genero: "Simulacion",
      precio: 299.00,
      imagen: portada("stardew-valley.svg"),
      descripcion: "Administra tu granja, haz amigos y descubre secretos del pueblo."
    },
    {
      id: 7,
      titulo: "God of War Ragnarok",
      plataforma: "PlayStation 5",
      genero: "Accion",
      precio: 1399.00,
      imagen: portada("god-of-war-ragnarok.svg"),
      descripcion: "Aventura de accion mitologica con combates intensos y gran historia."
    },
    {
      id: 8,
      titulo: "Marvel's Spider-Man 2",
      plataforma: "PlayStation 5",
      genero: "Accion",
      precio: 1399.00,
      imagen: portada("spider-man-2.svg"),
      descripcion: "Balanceate por la ciudad y vive una aventura de superheroes."
    },
    {
      id: 9,
      titulo: "Forza Horizon 5",
      plataforma: "Xbox Series X",
      genero: "Carreras",
      precio: 999.00,
      imagen: portada("forza-horizon-5.svg"),
      descripcion: "Carreras de mundo abierto con cientos de autos y eventos."
    },
    {
      id: 10,
      titulo: "Halo Infinite",
      plataforma: "Xbox Series X",
      genero: "Shooter",
      precio: 999.00,
      imagen: portada("halo-infinite.svg"),
      descripcion: "Shooter en primera persona con campana y multijugador."
    },
    {
      id: 11,
      titulo: "Minecraft",
      plataforma: "PC",
      genero: "Sandbox",
      precio: 499.00,
      imagen: portada("minecraft.svg"),
      descripcion: "Construye, explora y sobrevive en un mundo hecho de bloques."
    },
    {
      id: 12,
      titulo: "EA Sports FC 24",
      plataforma: "PlayStation 5",
      genero: "Deportes",
      precio: 1399.00,
      imagen: portada("ea-sports-fc-24.svg"),
      descripcion: "La experiencia de futbol con clubes, ligas y modos para todos."
    }
  ];

  /* Agrega a cada juego su precio ya formateado en pesos mexicanos
     y una imagen de respaldo, para mostrarlos en el HTML. */
  function normalizar(juego) {
    return Object.assign({}, juego, {
      precioTexto: "$" + Number(juego.precio).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + " MXN",
      imagenRespaldo: respaldo(juego.titulo)
    });
  }

  function leer(clave, porDefecto) {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? JSON.parse(crudo) : porDefecto;
    } catch (error) {
      return porDefecto;
    }
  }

  function escribir(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  const GameRepository = {
    obtenerTodos() {
      return JUEGOS_SEMILLA.map(normalizar);
    }
  };

  const AuthRepository = {
    obtenerUsuarios() {
      return leer(CLAVE_USUARIOS, []);
    },

    registrar(nombre, email, password) {
      nombre = (nombre || "").trim();
      email = (email || "").trim().toLowerCase();
      if (!nombre || !email || !password) {
        throw new Error("Completa todos los campos.");
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        throw new Error("El correo no es valido.");
      }
      if (password.length < 6) {
        throw new Error("La contrasena debe tener al menos 6 caracteres.");
      }
      const usuarios = this.obtenerUsuarios();
      if (usuarios.some(function (u) { return u.email === email; })) {
        throw new Error("Ese correo ya esta registrado.");
      }
      const usuario = { id: Date.now(), nombre: nombre, email: email, password: password };
      usuarios.push(usuario);
      escribir(CLAVE_USUARIOS, usuarios);
      escribir(CLAVE_SESION, email);
      return usuario;
    },

    iniciarSesion(email, password) {
      email = (email || "").trim().toLowerCase();
      const usuario = this.obtenerUsuarios().find(function (u) {
        return u.email === email && u.password === password;
      });
      if (!usuario) {
        throw new Error("Correo o contrasena incorrectos.");
      }
      escribir(CLAVE_SESION, usuario.email);
      return usuario;
    },

    cerrarSesion() {
      localStorage.removeItem(CLAVE_SESION);
    },

    usuarioActual() {
      const email = leer(CLAVE_SESION, null);
      if (!email) {
        return null;
      }
      return this.obtenerUsuarios().find(function (u) { return u.email === email; }) || null;
    }
  };

  /* Se publican para que los ViewModels puedan usarlos. */
  window.GameRepository = GameRepository;
  window.AuthRepository = AuthRepository;
})();
