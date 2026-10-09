# Documentacion de LEVEL_UP

Bienvenido/a al proyecto **LEVEL_UP**, tu tienda en linea de videojuegos.
Este documento explica, en palabras sencillas, como esta hecho el proyecto
para que cualquier colaborador pueda entenderlo y modificarlo sin miedo.

---

## 1. Que es LEVEL_UP

Es una tienda en linea de videojuegos hecha con **HTML, CSS y JavaScript puro**
(sin frameworks ni instalaciones). Tiene:

- **Inicio**: pagina de bienvenida con juegos destacados.
- **Catalogo**: todos los juegos, con buscador por nombre y filtros por
  plataforma y genero.
- **Iniciar sesion / Crear cuenta**: registro de usuarios (simulado).
- **Mi cuenta**: perfil del usuario con sesion iniciada.

---

## 2. Que es MVVM

**MVVM** separa el codigo en tres partes, cada una con una sola tarea.
Una forma facil de verlo es como un restaurante:

| Parte | En el restaurante | En LEVEL_UP | Donde vive |
|-------|-------------------|-------------|------------|
| **Model** | La despensa (los ingredientes) | Los datos: juegos y usuarios | Carpeta `M/` |
| **View** | El comedor (lo que ve el cliente) | El HTML y el CSS que ves | Carpeta `V/` |
| **ViewModel** | El mesero (lleva y trae pedidos) | El "cerebro" de cada pantalla | Carpeta `MV/` |

Diagrama del flujo:

```
   [ View ]            [ ViewModel ]             [ Model ]
  (HTML/CSS)   <-->   estado + logica   <-->   datos + localStorage
 lo que se ve          el cerebro                la despensa

   La View NUNCA habla directo con el Model:
   todo pasa por el ViewModel.
```

La gran ventaja: si cambias los datos (`M/`), no rompes el diseno (`V/`),
y si cambias el diseno, no rompes la logica (`MV/`).

---

## 3. Como se divide el codigo

```
LEVEL_UP/
├── DOCUMENTACION.md   <- este archivo
├── V/                 <- View: lo visual
│   ├── index.html
│   ├── catalogo.html
│   ├── login.html
│   ├── registro.html
│   ├── cuenta.html
│   ├── estilos.css
│   └── assets/        <- imagenes locales
├── MV/                <- ViewModel: la logica de pantalla + el motor
│   ├── motor.js
│   ├── navbar.js
│   ├── inicio.js
│   ├── catalogo.js
│   ├── auth.js
│   ├── cuenta.js
│   └── app.js
└── M/                 <- Model: los datos
    └── modelo.js
```

### Que hace cada archivo

| Archivo | Capa | Que contiene |
|---------|------|--------------|
| `M/modelo.js` | Model | La lista de juegos (`JUEGOS_SEMILLA`), los usuarios y el guardado en `localStorage`. |
| `MV/motor.js` | ViewModel | El motor MVVM: `observable`, `computed`, `efecto` y el lector de `data-bind`. |
| `MV/navbar.js` | ViewModel | La barra de navegacion, compartida por todas las paginas. |
| `MV/inicio.js` | ViewModel | Logica de la pagina de Inicio (los juegos destacados). |
| `MV/catalogo.js` | ViewModel | Buscador y filtros del catalogo. |
| `MV/auth.js` | ViewModel | Iniciar sesion y crear cuenta (mismo archivo para las dos). |
| `MV/cuenta.js` | ViewModel | Perfil del usuario. |
| `MV/app.js` | ViewModel | Arranque: inyecta la barra y conecta cada pagina con su ViewModel. |
| `V/*.html` | View | El HTML de cada pantalla. |
| `V/estilos.css` | View | Todos los estilos. |

### La regla de oro

> El HTML **no lleva logica**. Solo marcas con `data-bind` que dato quieres mostrar
> o que accion quieres disparar. La logica vive en el ViewModel.

Ejemplo: en lugar de escribir JavaScript dentro del HTML, escribes:

```html
<span data-bind="text: nombre"></span>
<button data-bind="click: cerrarSesion">Salir</button>
```

### Directivas de `data-bind`

| Directiva | Para que sirve | Ejemplo |
|-----------|----------------|---------|
| `text` | Mostrar texto | `data-bind="text: titulo"` |
| `value` | Valor de un input/select (en las dos direcciones) | `data-bind="value: query"` |
| `src` | Imagen (`<img>`), con respaldo opcional | `data-bind="src: imagen, respaldo: imagenRespaldo"` |
| `href`, `alt`, `title`, `placeholder` | Poner atributos | `data-bind="href: enlace"` |
| `respaldo` | Imagen alternativa si `src` no carga | `data-bind="src: imagen, respaldo: imagenRespaldo"` |
| `class` | Poner las clases CSS (texto completo) | `data-bind="class: claseActiva"` |
| `show` | Mostrar u ocultar | `data-bind="show: hayError"` |
| `disabled` | Activar/desactivar un control | `data-bind="disabled: bloqueado"` |
| `click` | Al hacer clic | `data-bind="click: comprar"` |
| `submit` | Al enviar un formulario | `data-bind="submit: enviar"` |
| `each` | Repetir por cada elemento de una lista | `data-bind="each: resultados"` |

Dentro de un `each`, cada dato del elemento se usa directo (`text: titulo`).
Si la lista es de textos simples, se usa `$item`.

---

## 4. El flujo de un dato (ejemplo del buscador)

Cuando escribes en el buscador del catalogo:

1. **View**: el `<input>` tiene `data-bind="value: query"`.
2. El motor detecta que escribiste y actualiza el observable `query`.
3. **ViewModel**: `resultados` (un `computed`) se vuelve a calcular con el
   nuevo texto y con los filtros activos.
4. El motor ve que `resultados` cambio y **vuelve a dibujar las tarjetas**.
5. **View**: ves la lista actualizada. No recargaste la pagina.

Todo eso lo conecta `MV/motor.js`; tu solo declaras los datos y el HTML.

---

## 5. Como agregar un juego nuevo

1. Abre `M/modelo.js`.
2. Busca la lista `JUEGOS_SEMILLA`.
3. Copia un bloque y cambia los datos. Debe quedar asi:

```js
{
  id: 13,
  titulo: "Tu Juego Nuevo",
  plataforma: "PC",
  genero: "RPG",
  precio: 999.00,
  imagen: portada("tu-juego-nuevo.svg"),
  descripcion: "Una descripcion corta del juego."
}
```

4. Guarda y recarga la pagina en el navegador. El juego aparece solo en el
   catalogo, en los destacados (si esta entre los primeros) y en los filtros.

**Reglas:**
- El `id` nunca debe repetirse.
- `precio` es un numero **en pesos mexicanos (MXN)**, sin el signo `$` ni la
  palabra MXN: el sistema los agrega. Ejemplo: `1399.00` se ve `$1,399.00 MXN`.
- `imagen` usa el helper `portada("archivo.svg")` (ver la seccion 6).
- `plataforma` y `genero` son texto libre. Si escribes uno nuevo, el filtro
  lo agrega automaticamente.

---

## 6. Como cambiar la imagen de un juego

Las portadas **no se guardan en el proyecto**: se cargan por URL desde un
repositorio de GitHub usando el CDN de jsDelivr. Asi el proyecto se mantiene
ligero. La constante que arma la URL esta en `M/modelo.js`:

```js
const BASE_IMAGENES = "https://cdn.jsdelivr.net/gh/ArtyA14/level-up-imagenes@main/portadas/";
```

**Opción A — Usar el repositorio de portadas (recomendado):**

1. Sube la nueva portada a la carpeta `portadas/` del repositorio
   `level-up-imagenes` (mira `LEVEL_UP-imagenes/README.md` para publicarlo).
2. En `M/modelo.js` escribe:

```js
imagen: portada("mi-juego.svg")
```

**Opción B — Una URL externa cualquiera:**

```js
imagen: "https://midominio.com/imagenes/mi-juego.png"
```

**Opción C — Imagen local (archivo en tu computadora):**

1. Copia el archivo dentro de `V/assets/`, por ejemplo `V/assets/mi-juego.png`.
2. En `M/modelo.js` escribe la ruta asi:

```js
imagen: "../assets/mi-juego.png"
```

El `../` es necesario porque el HTML se abre desde la carpeta `V`.

**Respaldo automatico:** si la imagen del repositorio no carga, el motor pone
una imagen de respaldo (`imagenRespaldo`, generada con `placehold.co`), asi
que nunca se ve rota. Esto lo hace la directiva `respaldo` en el HTML:

```html
<img data-bind="src: imagen, alt: titulo, respaldo: imagenRespaldo">
```

Recomendacion: usa imagenes verticales (mas altas que anchas), por ejemplo
300 x 420 pixeles.

---

## 7. Como agregar una plataforma o genero nuevo

No hay que tocar nada mas. Solo escribe el nuevo valor en un juego:

```js
plataforma: "Steam Deck",
genero: "Terror"
```

Los menus de filtros del catalogo se llenan solos con los valores que existan.

---

## 8. Como cambiar los estilos

Todos los estilos estan en `V/estilos.css`. Arriba del archivo hay una lista
de colores y medidas; cambia ahi para modificar el tema completo:

```css
:root {
  --fondo: #f6f7fb;
  --acento: #5b4bff;   /* el color principal (morado) */
  --texto: #17172b;
  /* ... */
}
```

Por ejemplo, si cambias `--acento` a `#e11d48`, todos los botones, enlaces y
precios cambiaran a rojo.

---

## 9. Como funciona el login (importante)

El login y el registro son **simulados**. No hay servidor ni base de datos:

- Los usuarios se guardan en el `localStorage` del navegador.
- Las contrasenas se guardan tal cual (sin cifrar), asi que **NO** sirve para
  un proyecto real en produccion. Es solo para practicar y aprender.
- Si borras los datos del navegador, los usuarios desaparecen.

---

## 10. Reglas para colaboradores

1. **No pongas logica en el HTML.** Solo `data-bind`.
2. Si un dato cambia y quieres que la pantalla se actualice solo, guardalo con
   `observable("valor")`.
3. Si un valor se calcula a partir de otros, usa `computed(() => ...)`.
4. Las acciones (lo que pasa al hacer clic) son **metodos** del ViewModel.
5. Para datos del catalogo o de usuarios, usa `GameRepository` y
   `AuthRepository` de `M/modelo.js`. No inventes otro almacenamiento.
6. Antes de terminar, abre todas las paginas y prueba que todo siga funcionando.

---

## 11. Como probar en tu computadora

1. Entra a la carpeta `V`.
2. Haz doble clic en `index.html` (o click derecho -> Abrir con tu navegador).
3. Navega entre las paginas con la barra de arriba.
4. Registrate, filtra el catalogo, cierra sesion y vuelve a entrar.

Necesitas internet solo para las imagenes que vienen por URL.
