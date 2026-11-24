function formatearPrecioAdmin(valor) {
  return "$" + Number(valor || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MXN";
}

function dividirLista(texto) {
  return String(texto || "")
    .split(",")
    .map((parte) => parte.trim())
    .filter((parte) => parte.length > 0);
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function aFechaInput(valor) {
  const fecha = valor && typeof valor.toDate === "function"
    ? valor.toDate()
    : (valor instanceof Date ? valor : null);
  if (!fecha || isNaN(fecha.getTime())) {
    return "";
  }
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

function formatearFechaAdmin(valor) {
  const fecha = valor && typeof valor.toDate === "function"
    ? valor.toDate()
    : (valor instanceof Date ? valor : null);
  if (!fecha || isNaN(fecha.getTime())) {
    return "—";
  }
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function inputAFecha(texto) {
  return texto ? new Date(texto + "T12:00:00") : null;
}

function claseEstadoAdmin(activo) {
  return "badge-admin " + (activo ? "badge-admin--activo" : "badge-admin--inactivo");
}

function etiquetaTipoPost(tipo) {
  const tipos = {
    discussion: "Discusión",
    question: "Pregunta",
    guide: "Guía",
    screenshot: "Captura"
  };
  return tipos[tipo] || tipo || "General";
}

function mensajeDeError(error) {
  if (!error) {
    return "";
  }
  if (error.code === "permission-denied") {
    return "Firestore rechazó la operación. Revisa que tu usuario tenga role admin y las reglas de seguridad.";
  }
  if (error.code === "unavailable") {
    return "Sin conexión con Firestore. Revisa tu internet e inténtalo de nuevo.";
  }
  return error.message || "";
}

class AdminViewModel {
  constructor() {
    const usuario = typeof AuthRepository !== "undefined" ? AuthRepository.usuarioActual() : null;
    const esAdmin = usuario && typeof AuthRepository.esAdmin === "function"
      ? AuthRepository.esAdmin(usuario)
      : !!usuario && usuario.role === "admin";
    if (!esAdmin) {
      window.location.href = "index.html";
      return;
    }

    this.usuarioAdmin = usuario;

    this.pestana = observable("dashboard");
    this.pestanas = [
      { id: "dashboard", etiqueta: "Dashboard" },
      { id: "juegos", etiqueta: "Juegos" },
      { id: "ofertas", etiqueta: "Ofertas" },
      { id: "usuarios", etiqueta: "Usuarios" },
      { id: "posts", etiqueta: "Comunidad" }
    ].map((pestana) => ({
      id: pestana.id,
      etiqueta: pestana.etiqueta,
      clase: computed(() =>
        "admin-pestana" + (this.pestana.get() === pestana.id ? " admin-pestana--activa" : "")
      ),
      click: () => this.cambiarPestana(pestana.id)
    }));

    this.esDashboard = computed(() => this.pestana.get() === "dashboard");
    this.esJuegos = computed(() => this.pestana.get() === "juegos");
    this.esOfertas = computed(() => this.pestana.get() === "ofertas");
    this.esUsuarios = computed(() => this.pestana.get() === "usuarios");
    this.esPosts = computed(() => this.pestana.get() === "posts");

    this.mensaje = observable("");
    this.hayMensaje = computed(() => this.mensaje.get().length > 0);
    this.error = observable("");
    this.hayError = computed(() => this.error.get().length > 0);

    this.cargandoStats = observable(false);
    this.statsGlobal = observable({});
    this.statsDiarias = observable([]);

    this.tarjetasStats = computed(() => {
      const stats = this.statsGlobal.get() || {};
      return [
        { etiqueta: "Usuarios registrados", valor: Number(stats.totalUsers || 0) },
        { etiqueta: "Juegos en catálogo", valor: Number(stats.totalGames || 0) },
        { etiqueta: "Compras realizadas", valor: Number(stats.totalPurchases || 0) },
        { etiqueta: "Ingresos totales", valor: formatearPrecioAdmin(stats.totalRevenue) },
        { etiqueta: "Reseñas", valor: Number(stats.totalReviews || 0) },
        { etiqueta: "Posts de comunidad", valor: Number(stats.totalPosts || 0) }
      ];
    });

    this.filasDiarias = computed(() => this.statsDiarias.get().map((dia) => ({
      fecha: dia.date || dia.id,
      nuevosUsuarios: Number(dia.newUsers || 0),
      compras: Number(dia.purchases || 0),
      ingresos: formatearPrecioAdmin(dia.revenue),
      resenas: Number(dia.reviews || 0)
    })));

    this.sinDias = computed(() =>
      !this.cargandoStats.get() && this.filasDiarias.get().length === 0
    );

    this.resumenDiario = computed(() => {
      const dias = this.statsDiarias.get();
      if (!dias.length) {
        return "";
      }
      const totalIngresos = dias.reduce((total, dia) => total + (Number(dia.revenue) || 0), 0);
      const totalCompras = dias.reduce((total, dia) => total + (Number(dia.purchases) || 0), 0);
      const mejor = dias.reduce((actual, dia) =>
        (Number(dia.revenue) || 0) > (Number(actual.revenue) || 0) ? dia : actual, dias[0]);
      return "En los últimos " + dias.length + " días registrados: " + totalCompras +
        " compras y " + formatearPrecioAdmin(totalIngresos) + " de ingreso. Mejor día: " +
        (mejor.date || mejor.id) + ".";
    });
    this.hayResumen = computed(() => this.resumenDiario.get().length > 0);

    this.cargandoJuegos = observable(false);
    this.juegosAdmin = observable([]);
    this.mostrandoFormJuego = observable(false);
    this.editandoJuego = observable(false);
    this.guardandoJuego = observable(false);
    this.errorJuego = observable("");
    this.hayErrorJuego = computed(() => this.errorJuego.get().length > 0);
    this.tituloFormJuego = computed(() => this.editandoJuego.get() ? "Editar juego" : "Nuevo juego");
    this.textoGuardarJuego = computed(() => this.guardandoJuego.get() ? "Guardando..." : "Guardar juego");

    this.juegoId = observable("");
    this.juegoTitulo = observable("");
    this.juegoSlug = observable("");
    this.juegoDescripcion = observable("");
    this.juegoDescripcionCorta = observable("");
    this.juegoDesarrollador = observable("");
    this.juegoDistribuidor = observable("");
    this.juegoPrecio = observable("");
    this.juegoGeneros = observable("");
    this.juegoEtiquetas = observable("");
    this.juegoPlataformas = observable("");
    this.juegoFecha = observable("");
    this.juegoPortada = observable("");
    this.juegoDestacado = observable(false);
    this.juegoActivo = observable(true);

    this.filasJuegos = computed(() => {
      const vm = this;
      return this.juegosAdmin.get().map((juego) => ({
        id: juego.id,
        titulo: juego.title || "(sin título)",
        generos: Array.isArray(juego.genres) && juego.genres.length
          ? juego.genres.join(", ")
          : "—",
        precio: Number(juego.price) === 0 ? "Gratis" : formatearPrecioAdmin(juego.price),
        estado: juego.isActive === false ? "Inactivo" : "Activo",
        claseEstado: claseEstadoAdmin(juego.isActive !== false),
        editar: function () { vm.abrirEdicionJuego(juego); },
        alternar: function () { vm.alternarJuego(juego); },
        textoAlternar: juego.isActive === false ? "Reactivar" : "Desactivar"
      }));
    });
    this.sinJuegos = computed(() =>
      !this.cargandoJuegos.get() && this.filasJuegos.get().length === 0
    );

    this.cargandoOfertas = observable(false);
    this.ofertasAdmin = observable([]);
    this.mostrandoFormOferta = observable(false);
    this.editandoOferta = observable(false);
    this.guardandoOferta = observable(false);
    this.errorOferta = observable("");
    this.hayErrorOferta = computed(() => this.errorOferta.get().length > 0);
    this.tituloFormOferta = computed(() => this.editandoOferta.get() ? "Editar oferta" : "Nueva oferta");
    this.textoGuardarOferta = computed(() => this.guardandoOferta.get() ? "Guardando..." : "Guardar oferta");

    this.ofertaId = observable("");
    this.ofertaJuegoId = observable("");
    this.ofertaPrecioViejo = observable("");
    this.ofertaPrecioNuevo = observable("");
    this.ofertaInicio = observable("");
    this.ofertaFin = observable("");

    this.opcionesJuegosHtml = computed(() => {
      const seleccionado = this.ofertaJuegoId.get();
      const opciones = ['<option value="">Selecciona un juego</option>'];
      this.juegosAdmin.get().forEach((juego) => {
        opciones.push(
          '<option value="' + escaparHtml(juego.id) + '"' +
          (juego.id === seleccionado ? " selected" : "") + ">" +
          escaparHtml(juego.title || "Sin título") + "</option>"
        );
      });
      return opciones.join("");
    });

    this.filasOfertas = computed(() => {
      const vm = this;
      return this.ofertasAdmin.get().map((oferta) => ({
        id: oferta.id,
        juego: oferta.gameTitle || oferta.gameId || "—",
        precios: formatearPrecioAdmin(oferta.oldPrice) + " → " + formatearPrecioAdmin(oferta.newPrice),
        descuento: "-" + Number(oferta.discountPercent || 0) + "%",
        vigencia: formatearFechaAdmin(oferta.startDate) + " – " + formatearFechaAdmin(oferta.endDate),
        estado: oferta.isActive === false ? "Inactiva" : "Activa",
        claseEstado: claseEstadoAdmin(oferta.isActive !== false),
        editar: function () { vm.abrirEdicionOferta(oferta); },
        alternar: function () { vm.alternarOferta(oferta); },
        textoAlternar: oferta.isActive === false ? "Reactivar" : "Desactivar"
      }));
    });
    this.sinOfertas = computed(() =>
      !this.cargandoOfertas.get() && this.filasOfertas.get().length === 0
    );

    efecto(() => {
      const id = this.ofertaJuegoId.get();
      if (this.editandoOferta.get()) {
        return;
      }
      const juego = this.juegosAdmin.get().find((j) => j.id === id);
      if (juego) {
        this.ofertaPrecioViejo.set(String(Number(juego.price) || 0));
      }
    });

    this.cargandoUsuarios = observable(false);
    this.usuariosAdmin = observable([]);
    this.filasUsuarios = computed(() => {
      const vm = this;
      const miUid = this.usuarioAdmin.uid;
      return this.usuariosAdmin.get().map((usuario) => {
        const esAdmin = usuario.role === "admin";
        const esPropio = usuario.id === miUid || usuario.uid === miUid;
        return {
          id: usuario.id,
          username: usuario.username || "(sin nombre)",
          email: usuario.email || "—",
          rol: esAdmin ? "Admin" : "Usuario",
          claseRol: "badge-admin " + (esAdmin ? "badge-admin--admin" : "badge-admin--usuario"),
          estado: usuario.isActive === false ? "Baneado" : "Activo",
          claseEstado: claseEstadoAdmin(usuario.isActive !== false),
          esPropio: esPropio,
          textoRol: esAdmin ? "Quitar admin" : "Hacer admin",
          textoBan: usuario.isActive === false ? "Desbanear" : "Banear",
          cambiarRol: function () { vm.cambiarRol(usuario); },
          alternarBan: function () { vm.alternarBan(usuario); }
        };
      });
    });
    this.sinUsuarios = computed(() =>
      !this.cargandoUsuarios.get() && this.filasUsuarios.get().length === 0
    );

    this.cargandoPosts = observable(false);
    this.postsAdmin = observable([]);
    this.filasPosts = computed(() => {
      const vm = this;
      return this.postsAdmin.get().map((post) => ({
        id: post.id,
        titulo: post.title || "(sin título)",
        autor: post.authorName || post.authorId || "—",
        tipo: etiquetaTipoPost(post.type),
        fecha: formatearFechaAdmin(post.createdAt),
        borrar: function () { vm.borrarPost(post); }
      }));
    });
    this.sinPosts = computed(() =>
      !this.cargandoPosts.get() && this.filasPosts.get().length === 0
    );

    this.cargarDashboard();
  }

  cambiarPestana(id) {
    this.pestana.set(id);
    this.mensaje.set("");
    this.error.set("");
    if (id === "dashboard") {
      this.cargarDashboard();
    } else if (id === "juegos") {
      this.cargarJuegos();
    } else if (id === "ofertas") {
      this.cargarOfertas();
    } else if (id === "usuarios") {
      this.cargarUsuarios();
    } else if (id === "posts") {
      this.cargarPosts();
    }
  }

  avisar(texto) {
    this.error.set("");
    this.mensaje.set("");
    this.mensaje.set(texto);
  }

  async cargarDashboard() {
    this.error.set("");
    this.cargandoStats.set(true);
    try {
      const stats = await import("../M/stats.model.js");
      const global = await stats.getGlobalStats().catch(() => null);
      const diarias = await stats.getDailyStats(7).catch(() => []);
      this.statsGlobal.set(global || {});
      this.statsDiarias.set(diarias || []);
    } catch (e) {
      this.statsGlobal.set({});
      this.statsDiarias.set([]);
    } finally {
      this.cargandoStats.set(false);
    }
  }

  async cargarJuegos() {
    this.error.set("");
    this.cargandoJuegos.set(true);
    try {
      const games = await import("../M/games.model.js");
      const lista = await games.getAllGamesAdmin();
      this.juegosAdmin.set(lista);
    } catch (e) {
      this.error.set(mensajeDeError(e) || "No se pudieron cargar los juegos.");
    } finally {
      this.cargandoJuegos.set(false);
    }
  }

  async cargarOfertas() {
    this.error.set("");
    this.cargandoOfertas.set(true);
    try {
      const offers = await import("../M/offers.model.js");
      const listaOfertas = await offers.getAllOffers();
      if (this.juegosAdmin.get().length === 0) {
        const games = await import("../M/games.model.js");
        const listaJuegos = await games.getAllGamesAdmin();
        this.juegosAdmin.set(listaJuegos);
      }
      this.ofertasAdmin.set(listaOfertas);
    } catch (e) {
      this.error.set(mensajeDeError(e) || "No se pudieron cargar las ofertas.");
    } finally {
      this.cargandoOfertas.set(false);
    }
  }

  async cargarUsuarios() {
    this.error.set("");
    this.cargandoUsuarios.set(true);
    try {
      const users = await import("../M/users.model.js");
      const lista = await users.getAllUsers();
      this.usuariosAdmin.set(lista);
    } catch (e) {
      this.error.set(mensajeDeError(e) || "No se pudieron cargar los usuarios.");
    } finally {
      this.cargandoUsuarios.set(false);
    }
  }

  async cargarPosts() {
    this.error.set("");
    this.cargandoPosts.set(true);
    try {
      const posts = await import("../M/posts.model.js");
      const lista = await posts.getAllPosts();
      this.postsAdmin.set(lista);
    } catch (e) {
      this.error.set(mensajeDeError(e) || "No se pudo cargar la comunidad.");
    } finally {
      this.cargandoPosts.set(false);
    }
  }

  nuevoJuego() {
    this.editandoJuego.set(false);
    this.errorJuego.set("");
    this.juegoId.set("");
    this.juegoTitulo.set("");
    this.juegoSlug.set("");
    this.juegoDescripcion.set("");
    this.juegoDescripcionCorta.set("");
    this.juegoDesarrollador.set("");
    this.juegoDistribuidor.set("");
    this.juegoPrecio.set("");
    this.juegoGeneros.set("");
    this.juegoEtiquetas.set("");
    this.juegoPlataformas.set("");
    this.juegoFecha.set("");
    this.juegoPortada.set("");
    this.juegoDestacado.set(false);
    this.juegoActivo.set(true);
    this.mostrandoFormJuego.set(true);
  }

  abrirEdicionJuego(juego) {
    this.editandoJuego.set(true);
    this.errorJuego.set("");
    this.juegoId.set(juego.id);
    this.juegoTitulo.set(juego.title || "");
    this.juegoSlug.set(juego.slug || "");
    this.juegoDescripcion.set(juego.description || "");
    this.juegoDescripcionCorta.set(juego.shortDescription || "");
    this.juegoDesarrollador.set(juego.developer || "");
    this.juegoDistribuidor.set(juego.publisher || "");
    this.juegoPrecio.set(juego.price === 0 ? "0" : String(juego.price ?? ""));
    this.juegoGeneros.set(Array.isArray(juego.genres) ? juego.genres.join(", ") : "");
    this.juegoEtiquetas.set(Array.isArray(juego.tags) ? juego.tags.join(", ") : "");
    this.juegoPlataformas.set(Array.isArray(juego.platforms) ? juego.platforms.join(", ") : "");
    this.juegoFecha.set(aFechaInput(juego.releaseDate));
    this.juegoPortada.set(juego.coverUrl || "");
    this.juegoDestacado.set(juego.isFeatured === true);
    this.juegoActivo.set(juego.isActive !== false);
    this.mostrandoFormJuego.set(true);
  }

  cancelarJuego() {
    this.mostrandoFormJuego.set(false);
    this.errorJuego.set("");
  }

  async guardarJuego() {
    this.errorJuego.set("");
    const idActual = this.juegoId.get();
    const titulo = this.juegoTitulo.get().trim();
    const slug = this.juegoSlug.get().trim().toLowerCase().replace(/\s+/g, "-");
    const descripcion = this.juegoDescripcion.get().trim();
    const descripcionCorta = this.juegoDescripcionCorta.get().trim();
    const desarrollador = this.juegoDesarrollador.get().trim();
    const distribuidor = this.juegoDistribuidor.get().trim();
    const portada = this.juegoPortada.get().trim();
    const precio = Number(this.juegoPrecio.get());
    const generos = dividirLista(this.juegoGeneros.get());
    const plataformas = dividirLista(this.juegoPlataformas.get());
    const fecha = inputAFecha(this.juegoFecha.get());

    if (!titulo || !slug || !descripcion || !descripcionCorta || !desarrollador || !distribuidor || !portada) {
      this.errorJuego.set("Completa todos los campos obligatorios.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      this.errorJuego.set("El slug solo puede tener letras minúsculas, números y guiones.");
      return;
    }
    if (isNaN(precio) || precio < 0) {
      this.errorJuego.set("El precio debe ser un número mayor o igual a 0.");
      return;
    }
    if (!generos.length || !plataformas.length) {
      this.errorJuego.set("Agrega al menos un género y una plataforma.");
      return;
    }
    if (!fecha || isNaN(fecha.getTime())) {
      this.errorJuego.set("La fecha de lanzamiento no es válida.");
      return;
    }
    const slugRepetido = this.juegosAdmin.get().some((juego) =>
      juego.id !== idActual && String(juego.slug || "").toLowerCase() === slug
    );
    if (slugRepetido) {
      this.errorJuego.set("Ya existe un juego con ese slug.");
      return;
    }

    const datos = {
      title: titulo,
      slug: slug,
      description: descripcion,
      shortDescription: descripcionCorta,
      developer: desarrollador,
      publisher: distribuidor,
      price: precio,
      genres: generos,
      tags: dividirLista(this.juegoEtiquetas.get()),
      platforms: plataformas,
      releaseDate: fecha,
      coverUrl: portada,
      isFeatured: this.juegoDestacado.get(),
      isActive: this.juegoActivo.get()
    };

    this.guardandoJuego.set(true);
    try {
      const games = await import("../M/games.model.js");
      if (idActual) {
        await games.updateGame(idActual, datos);
        this.avisar("Juego actualizado.");
      } else {
        await games.createGame(datos);
        this.avisar("Juego creado.");
      }
      this.mostrandoFormJuego.set(false);
      await this.cargarJuegos();
    } catch (e) {
      this.errorJuego.set(mensajeDeError(e) || "No se pudo guardar el juego.");
    } finally {
      this.guardandoJuego.set(false);
    }
  }

  async alternarJuego(juego) {
    const estabaActivo = juego.isActive !== false;
    if (estabaActivo && !window.confirm("¿Desactivar \"" + (juego.title || "este juego") + "\"? Dejará de mostrarse en la tienda.")) {
      return;
    }
    try {
      const games = await import("../M/games.model.js");
      if (estabaActivo) {
        await games.deleteGame(juego.id);
      } else {
        await games.reactivarGame(juego.id);
      }
      this.avisar(estabaActivo ? "Juego desactivado." : "Juego reactivado.");
      await this.cargarJuegos();
    } catch (e) {
      this.error.set(mensajeDeError(e) || "No se pudo cambiar el estado del juego.");
    }
  }

  async nuevaOferta() {
    this.errorOferta.set("");
    if (this.juegosAdmin.get().length === 0) {
      await this.cargarJuegos();
    }
    this.editandoOferta.set(false);
    this.ofertaId.set("");
    this.ofertaPrecioNuevo.set("");
    this.ofertaInicio.set("");
    this.ofertaFin.set("");
    const primero = this.juegosAdmin.get()[0];
    this.ofertaJuegoId.set(primero ? primero.id : "");
    this.ofertaPrecioViejo.set(primero ? String(Number(primero.price) || 0) : "");
    this.mostrandoFormOferta.set(true);
  }

  abrirEdicionOferta(oferta) {
    this.editandoOferta.set(true);
    this.errorOferta.set("");
    this.ofertaId.set(oferta.id);
    this.ofertaJuegoId.set(oferta.gameId || "");
    this.ofertaPrecioViejo.set(String(oferta.oldPrice ?? ""));
    this.ofertaPrecioNuevo.set(String(oferta.newPrice ?? ""));
    this.ofertaInicio.set(aFechaInput(oferta.startDate));
    this.ofertaFin.set(aFechaInput(oferta.endDate));
    this.mostrandoFormOferta.set(true);
  }

  cancelarOferta() {
    this.mostrandoFormOferta.set(false);
    this.errorOferta.set("");
  }

  async guardarOferta() {
    this.errorOferta.set("");
    const idActual = this.ofertaId.get();
    const juegoId = this.ofertaJuegoId.get();
    const juego = this.juegosAdmin.get().find((j) => j.id === juegoId);
    const precioViejo = Number(this.ofertaPrecioViejo.get());
    const precioNuevo = Number(this.ofertaPrecioNuevo.get());
    const inicio = inputAFecha(this.ofertaInicio.get());
    const fin = inputAFecha(this.ofertaFin.get());

    if (!juego) {
      this.errorOferta.set("Selecciona un juego.");
      return;
    }
    if (isNaN(precioViejo) || precioViejo <= 0) {
      this.errorOferta.set("El precio normal debe ser mayor que 0.");
      return;
    }
    if (isNaN(precioNuevo) || precioNuevo < 0 || precioNuevo >= precioViejo) {
      this.errorOferta.set("El precio con descuento debe ser menor que el precio normal.");
      return;
    }
    if (!inicio || !fin || isNaN(inicio.getTime()) || isNaN(fin.getTime()) || fin <= inicio) {
      this.errorOferta.set("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }

    const datos = {
      gameId: juego.id,
      gameTitle: juego.title || "",
      coverUrl: juego.coverUrl || "",
      oldPrice: precioViejo,
      newPrice: precioNuevo,
      discountPercent: Math.round((1 - precioNuevo / precioViejo) * 100),
      startDate: inicio,
      endDate: fin
    };

    this.guardandoOferta.set(true);
    try {
      const offers = await import("../M/offers.model.js");
      if (idActual) {
        await offers.updateOffer(idActual, datos);
        this.avisar("Oferta actualizada.");
      } else {
        await offers.createOffer(datos);
        this.avisar("Oferta creada.");
      }
      this.mostrandoFormOferta.set(false);
      await this.cargarOfertas();
    } catch (e) {
      this.errorOferta.set(mensajeDeError(e) || "No se pudo guardar la oferta.");
    } finally {
      this.guardandoOferta.set(false);
    }
  }

  async alternarOferta(oferta) {
    const estabaActiva = oferta.isActive !== false;
    if (estabaActiva && !window.confirm("¿Desactivar la oferta de \"" + (oferta.gameTitle || "este juego") + "\"?")) {
      return;
    }
    try {
      const offers = await import("../M/offers.model.js");
      if (estabaActiva) {
        await offers.deactivateOffer(oferta.id);
      } else {
        await offers.reactivarOffer(oferta.id);
      }
      this.avisar(estabaActiva ? "Oferta desactivada." : "Oferta reactivada.");
      await this.cargarOfertas();
    } catch (e) {
      this.error.set(mensajeDeError(e) || "No se pudo cambiar el estado de la oferta.");
    }
  }

  async cambiarRol(usuario) {
    if (usuario.id === this.usuarioAdmin.uid) {
      this.error.set("No puedes cambiar tu propio rol.");
      return;
    }
    const nuevoRol = usuario.role === "admin" ? "user" : "admin";
    const pregunta = nuevoRol === "admin"
      ? "¿Dar permisos de administrador a \"" + (usuario.username || usuario.email) + "\"?"
      : "¿Quitar los permisos de administrador a \"" + (usuario.username || usuario.email) + "\"?";
    if (!window.confirm(pregunta)) {
      return;
    }
    try {
      const users = await import("../M/users.model.js");
      await users.setUserRole(usuario.id, nuevoRol);
      this.avisar("Rol actualizado.");
      await this.cargarUsuarios();
    } catch (e) {
      this.error.set(mensajeDeError(e) || "No se pudo cambiar el rol.");
    }
  }

  async alternarBan(usuario) {
    if (usuario.id === this.usuarioAdmin.uid) {
      this.error.set("No puedes banearte a ti mismo.");
      return;
    }
    const estabaActivo = usuario.isActive !== false;
    const pregunta = estabaActivo
      ? "¿Banear a \"" + (usuario.username || usuario.email) + "\"? Su cuenta quedará inactiva."
      : "¿Desbanear a \"" + (usuario.username || usuario.email) + "\"?";
    if (!window.confirm(pregunta)) {
      return;
    }
    try {
      const users = await import("../M/users.model.js");
      await users.setUserActive(usuario.id, !estabaActivo);
      this.avisar(estabaActivo ? "Usuario baneado." : "Usuario desbaneado.");
      await this.cargarUsuarios();
    } catch (e) {
      this.error.set(mensajeDeError(e) || "No se pudo cambiar el estado del usuario.");
    }
  }

  async borrarPost(post) {
    if (!window.confirm("¿Borrar el post \"" + (post.title || "sin título") + "\"? Esta acción no se puede deshacer.")) {
      return;
    }
    try {
      const posts = await import("../M/posts.model.js");
      await posts.deletePost(post.id);
      this.avisar("Post eliminado.");
      await this.cargarPosts();
    } catch (e) {
      this.error.set(mensajeDeError(e) || "No se pudo borrar el post.");
    }
  }
}

window.AdminViewModel = AdminViewModel;
