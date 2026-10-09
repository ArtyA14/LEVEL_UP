/* MV — Motor MVVM
   Responsabilidad: hacer que el HTML (View) y los ViewModels se hablen solos.
   Aqui estan las piezas del patron: observable, computed, efecto y el
   interpretador de los atributos data-bind. */

let observadorActual = null;

/* observable: guarda un valor. Cuando cambia, avisa a quien lo este mirando. */
function observable(valorInicial) {
  let valor = valorInicial;
  const observadores = new Set();

  return {
    get() {
      if (observadorActual) {
        observadores.add(observadorActual);
      }
      return valor;
    },
    set(nuevo) {
      if (valor === nuevo) {
        return;
      }
      valor = nuevo;
      observadores.forEach(function (fn) { fn(); });
    }
  };
}

/* computed: un valor que se calcula a partir de otros observables
   y se vuelve a calcular automaticamente cuando estos cambian. */
function computed(fn) {
  let valor;
  const dependientes = new Set();

  const reevaluar = function () {
    const anterior = observadorActual;
    observadorActual = reevaluar;
    try {
      valor = fn();
    } finally {
      observadorActual = anterior;
    }
    dependientes.forEach(function (fn2) { fn2(); });
  };

  reevaluar();

  return {
    get() {
      if (observadorActual) {
        dependientes.add(observadorActual);
      }
      return valor;
    }
  };
}

/* efecto: ejecuta una funcion y la vuelve a ejecutar
   cada vez que cambia algo que haya leido. */
function efecto(fn) {
  const ejecutar = function () {
    const anterior = observadorActual;
    observadorActual = ejecutar;
    try {
      fn();
    } finally {
      observadorActual = anterior;
    }
  };
  ejecutar();
}

function esObservable(valor) {
  return valor !== null && typeof valor === "object" && typeof valor.get === "function";
}

function esEscribible(valor) {
  return esObservable(valor) && typeof valor.set === "function";
}

function formatear(valor) {
  return valor === null || valor === undefined ? "" : String(valor);
}

/* Convierte "text: titulo, click: comprar" en { text: "titulo", click: "comprar" } */
function leerDirectivas(el) {
  const texto = el.getAttribute("data-bind");
  if (!texto) {
    return null;
  }
  const mapa = {};
  texto.split(",").forEach(function (parte) {
    const corte = parte.indexOf(":");
    if (corte === -1) {
      return;
    }
    mapa[parte.slice(0, corte).trim()] = parte.slice(corte + 1).trim();
  });
  return mapa;
}

/* Busca "titulo" o "usuario.nombre" dentro de la lista de ambitos
   (primero el elemento repetido, luego el ViewModel). */
function buscarRuta(ambitos, ruta) {
  const partes = ruta.split(".");
  for (let i = 0; i < ambitos.length; i++) {
    let valor = ambitos[i];
    let padre = null;
    let encontrado = true;
    if (valor === null || valor === undefined) {
      continue;
    }
    for (let j = 0; j < partes.length; j++) {
      if (valor === null || valor === undefined) {
        encontrado = false;
        break;
      }
      padre = valor;
      valor = valor[partes[j]];
    }
    if (encontrado && valor !== undefined) {
      return { valor: valor, padre: padre };
    }
  }
  return { valor: undefined, padre: null };
}

function resolver(ambitos, ruta) {
  const resultado = buscarRuta(ambitos, ruta);
  return esObservable(resultado.valor) ? resultado.valor.get() : resultado.valor;
}

function resolverEscribible(ambitos, ruta) {
  const resultado = buscarRuta(ambitos, ruta);
  return esEscribible(resultado.valor) ? resultado.valor : null;
}

function resolverFuncion(ambitos, ruta) {
  const resultado = buscarRuta(ambitos, ruta);
  return typeof resultado.valor === "function" ? resultado.valor.bind(resultado.padre) : null;
}

function aplicarDirectivas(el, ambitos, d) {
  if (d.text !== undefined) {
    efecto(function () { el.textContent = formatear(resolver(ambitos, d.text)); });
  }
  if (d.html !== undefined) {
    efecto(function () { el.innerHTML = formatear(resolver(ambitos, d.html)); });
  }
  if (d.value !== undefined) {
    efecto(function () {
      const valor = resolver(ambitos, d.value);
      const texto = valor === null || valor === undefined ? "" : String(valor);
      if (el.value !== texto) {
        el.value = texto;
      }
    });
    const actualizar = function () {
      const obs = resolverEscribible(ambitos, d.value);
      if (obs) {
        obs.set(el.value);
      }
    };
    el.addEventListener("input", actualizar);
    el.addEventListener("change", actualizar);
  }

  if (d.src !== undefined) {
    efecto(function () {
      const url = resolver(ambitos, d.src);
      if (url) {
        el.setAttribute("src", url);
      } else {
        el.removeAttribute("src");
      }
    });
    el.addEventListener("error", function () {
      if (d.respaldo === undefined) {
        return;
      }
      const url = resolver(ambitos, d.respaldo);
      if (url && el.getAttribute("src") !== url) {
        el.setAttribute("src", url);
      }
    });
  }

  ["href", "alt", "title", "placeholder"].forEach(function (atributo) {
    const ruta = d[atributo];
    if (ruta === undefined) {
      return;
    }
    efecto(function () {
      const valor = resolver(ambitos, ruta);
      if (valor === null || valor === undefined || valor === "") {
        el.removeAttribute(atributo);
      } else {
        el.setAttribute(atributo, valor);
      }
    });
  });

  if (d.disabled !== undefined) {
    efecto(function () { el.disabled = !!resolver(ambitos, d.disabled); });
  }

  if (d.show !== undefined || d.visible !== undefined) {
    const ruta = d.show !== undefined ? d.show : d.visible;
    efecto(function () {
      if (el.dataset.displayOriginal === undefined) {
        el.dataset.displayOriginal = el.style.display || "";
      }
      el.style.display = resolver(ambitos, ruta) ? el.dataset.displayOriginal : "none";
    });
  }

  if (d.class !== undefined) {
    efecto(function () { el.className = formatear(resolver(ambitos, d.class)); });
  }

  if (d.click !== undefined) {
    const fn = resolverFuncion(ambitos, d.click);
    if (fn) {
      el.addEventListener("click", function (evento) {
        evento.preventDefault();
        fn(ambitos[0], evento);
      });
    }
  }

  if (d.submit !== undefined) {
    const fn = resolverFuncion(ambitos, d.submit);
    if (fn) {
      el.addEventListener("submit", function (evento) {
        evento.preventDefault();
        fn(ambitos[0], evento);
      });
    }
  }
}

/* each / foreach: repite el contenido interno por cada elemento de una lista.
   El atributo de lista debe ser directamente un observable/computed o un arreglo. */
function compilarLista(el, ambitos, d) {
  const ruta = d.each !== undefined ? d.each : d.foreach;
  const plantilla = el.innerHTML;
  el.innerHTML = "";

  efecto(function () {
    const lista = resolver(ambitos, ruta) || [];
    el.innerHTML = "";
    lista.forEach(function (item) {
      const caja = document.createElement("div");
      caja.innerHTML = plantilla;
      const ambitoItem = item !== null && typeof item === "object" ? item : { $item: item };
      Array.from(caja.children).forEach(function (hijo) {
        compilarNodo(hijo, [ambitoItem].concat(ambitos));
        el.appendChild(hijo);
      });
    });
  });
}

function compilarNodo(el, ambitos) {
  const d = leerDirectivas(el);

  if (d && (d.each !== undefined || d.foreach !== undefined)) {
    compilarLista(el, ambitos, d);
    const resto = {};
    let hay = false;
    for (const clave in d) {
      if (clave !== "each" && clave !== "foreach") {
        resto[clave] = d[clave];
        hay = true;
      }
    }
    if (hay) {
      aplicarDirectivas(el, ambitos, resto);
    }
    return;
  }

  if (d) {
    aplicarDirectivas(el, ambitos, d);
  }

  Array.from(el.children).forEach(function (hijo) { compilarNodo(hijo, ambitos); });
}

/* Aplica los bindings de un ViewModel a un pedazo del HTML. */
function aplicar(vm, raiz) {
  compilarNodo(raiz || document.body, [vm]);
}

window.Motor = {
  observable: observable,
  computed: computed,
  efecto: efecto,
  aplicar: aplicar
};
