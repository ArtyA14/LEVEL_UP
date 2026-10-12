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
      titulo: "The Witcher 3: Wild hunt - Remastered",
      plataforma: "PC, Xbox Series X/S, Playstation 5 y Nintendo Switch 2",
      genero: "RPG",
      precio: 999.00,
      imagen: portada("the-witcher-3.svg"),
      descripcion: "Revive la extrordinaira aventura de Gerald de rivia en el nuevo remaster."
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
      titulo: "Helldivers 2",
      plataforma: "PC, Xbox Series X/S y Playstation 5",
      genero: "Accion",
      precio: 799.00,
      imagen: portada("helldivers-2.svg"),
      descripcion: "Aventura de accion epica defendiendo la Supertierra."
    },
    {
      id: 8,
      titulo: "Marvel's Spider-Man 2",
      plataforma: "PC",
      genero: "Accion",
      precio: 1399.00,
      imagen: portada("spider-man-2.svg"),
      descripcion: "Balanceate por la ciudad y vive una aventura de superheroes."
    },
    {
      id: 9,
      titulo: "Forza Horizon 6",
      plataforma: "PC, Xbox Series X/S y Playstation 5",
      genero: "Carreras",
      precio: 999.00,
      imagen: portada("forza-horizon-8.svg"),
      descripcion: "Carreras de mundo abierto en japon con cientos de autos y eventos."
    },
    {
      id: 10,
      titulo: "Halo Campeing Evolved",
      plataforma: "PC, Xbox Series X/S y Playstation 5",
      genero: "Shooter",
      precio: 999.00,
      imagen: portada("halo-campeing-evolved.svg"),
      descripcion: "Regresa al anillo en donde todo comenzo hace un cuarto de siglo."
    },
    {
      id: 11,
      titulo: "Minecraft",
      plataforma: "PC, Xbox Series X/S y Playstation 5",
      genero: "Sandbox",
      precio: 499.00,
      imagen: portada("minecraft.svg"),
      descripcion: "Construye, explora y sobrevive en un mundo hecho de bloques."
    },
    {
      id: 12,
      titulo: "Warhammer 40000 Space Marine 2",
      plataforma: "PC, Xbox Series X/S y Playstation 5",
      genero: "Shooter",
      precio: 899.00,
      imagen: portada("space-marine-2.svg"),
      descripcion: "En el milenio 40,000 solamente existe la guerra."
    },
    {
      id: 13,
      titulo: "Ride 6",
      plataforma: "PC, Xbox Series X/S y Playstation 5",
      genero: "Simulacion",
      precio: 1199.00,
      imagen: portada("ride-6.svg"),
      descripcion: "Monta una infinidad de motocicliedas en asfalto o tierra."
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
