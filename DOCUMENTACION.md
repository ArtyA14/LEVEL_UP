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
- **Ofertas**: descuentos activos, con precio original tachado y badge de
  descuento. El destacado del catalogo es el juego con mayor descuento.
- **Iniciar sesion / Crear cuenta**: registro de usuarios con
  **Firebase Auth** (correo y contrasena), ya no simulado.
- **Mi cuenta**: perfil del usuario con sesion iniciada.
- **Admin**: panel para el administrador, donde crea, edita y desactiva
  juegos, y crea y desactiva ofertas.

El backend es **Firebase**: Authentication para los usuarios y
**Cloud Firestore** para los datos. Los juegos ya no se guardan solo en el
codigo: viven en Firestore y la app los lee de ahi. El catalogo local
(`JUEGOS_SEMILLA` en `M/modelo.js`) queda solo como respaldo, por si
Firestore tarda o falla.

Proyecto de Firebase en uso: **LEVEL-UP**, ID `level-up-41f05`
(cuenta del equipo). Hay un proyecto temporal de respaldo,
**Level Up Temp**, ID `level-up-temp-d5f8b`, con los mismos datos,
que se uso mientras la cuenta original estuvo suspendida.

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
  (HTML/CSS)   <-->   estado + logica   <-->   datos + Firestore
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
├── firestore.rules    <- reglas de seguridad de Firestore
├── V/                 <- View: lo visual
│   ├── index.html
│   ├── catalogo.html
│   ├── login.html
│   ├── registro.html
│   ├── cuenta.html
│   ├── admin.html     <- panel del administrador
│   ├── estilos.css
│   └── assets/        <- imagenes locales
├── MV/                <- ViewModel: la logica de pantalla + el motor
│   ├── motor.js
│   ├── navbar.js
│   ├── inicio.js
│   ├── catalogo.js
│   ├── auth.js
│   ├── login.js
│   ├── registro.js
│   ├── auth-bridge.js
│   ├── admin.js
│   ├── cuenta.js
│   └── app.js
└── M/                 <- Model: los datos
    ├── modelo.js          <- catalogo local (respaldo) y repositorios
    ├── firebase-config.js <- conexion a Firebase (proyecto en uso)
    ├── games.model.js     <- juegos en Firestore
    ├── offers.model.js    <- ofertas en Firestore
    ├── users.model.js     <- perfiles de usuario en Firestore
    └── auth.model.js      <- registro e inicio de sesion con Firebase Auth
```

### Que hace cada archivo

| Archivo | Capa | Que contiene |
|---------|------|--------------|
| `M/modelo.js` | Model | La lista local de juegos (`JUEGOS_SEMILLA`, 13 juegos), usada como respaldo si Firestore no responde. |
| `M/firebase-config.js` | Model | La configuracion de Firebase del proyecto en uso. De ahi salen `db` y `auth`. |
| `M/games.model.js` | Model | Juegos en Firestore: `getGames`, `getGameById`, `createGame`, `updateGame`, `deleteGame` (logico) y `getAllGames` (para el admin). |
| `M/offers.model.js` | Model | Ofertas en Firestore: `getActiveOffers`, `createOffer`, `deactivateOffer`, `getEffectivePrice`. |
| `M/users.model.js` | Model | Perfiles en Firestore: `createUserProfile`, `getUserById`, biblioteca y wishlist. |
| `M/auth.model.js` | Model | Registro, inicio y cierre de sesion con Firebase Auth, y `esAdmin`. |
| `firestore.rules` | Seguridad | Quien puede leer y escribir cada coleccion (ver seccion 9). |
| `MV/motor.js` | ViewModel | El motor MVVM: `observable`, `computed`, `efecto` y el lector de `data-bind`. |
| `MV/navbar.js` | ViewModel | La barra de navegacion, compartida por todas las paginas. |
| `MV/inicio.js` | ViewModel | Logica de la pagina de Inicio (los juegos destacados, desde Firestore). |
| `MV/catalogo.js` | ViewModel | Buscador y filtros del catalogo (desde Firestore, con ofertas). |
| `MV/auth.js` | ViewModel | Iniciar sesion y crear cuenta (mismo archivo para las dos). |
| `MV/login.js` / `MV/registro.js` | ViewModel | ViewModels de login y registro conectados a Firebase Auth. |
| `MV/auth-bridge.js` | ViewModel | Reemplaza `AuthRepository` por la version de Firebase, para que el guard del catalogo no bote al login. |
| `MV/admin.js` | ViewModel | Logica del panel admin: crear/editar juegos y ofertas. Solo si el usuario es admin. |
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

## 5. Como se cargan los juegos desde Firestore

Inicio y catalogo primero muestran el catalogo local como respaldo, y luego
lo reemplazan con los juegos de Firestore:

1. `MV/inicio.js` y `MV/catalogo.js` importan `M/games.model.js` y
   `M/offers.model.js`.
2. `getGames()` trae los juegos activos y `getActiveOffers()` las ofertas
   vigentes (hasta el 30 de noviembre de 2026).
3. Cada juego se mapea a los campos en espanol que usa la vista:
   `title` pasa a `titulo`, `coverUrl` a `imagen`, `platforms[]` a
   `plataforma` (todas las plataformas, separadas por coma) y
   `plataformaCorta`, `genres[0]` a `genero`, `price` a `precioTexto`.
4. Si hay oferta para ese juego, el precio y el descuento vienen de la
   oferta (`newPrice` y `discountPercent`), no del juego.
5. Si Firestore falla, se queda el catalogo local y la pagina sigue
   funcionando.

Por eso `plataforma` y `plataformaCorta` muestran la lista completa
(por ejemplo "PC, Xbox Series X/S, Playstation 5, Nintendo Switch 2"),
no solo la primera plataforma.

---

## 6. Como agregar un juego nuevo

**La forma normal ahora es desde el panel admin**, no editando el codigo:

1. Inicia sesion con la cuenta admin.
2. Abre `V/admin.html`.
3. Llena el formulario (titulo, precio, plataformas, genero, imagen) y guarda.
4. El juego aparece en Firestore y luego en el catalogo. No hay que tocar
   `M/modelo.js`.

El juego nuevo recibe un ID automatico de Firestore, asi que en la consola
se ve con un ID raro, no con su titulo: para encontrarlo, abre el documento
y revisa el campo `title`.

**Borrar un juego** desde el admin no lo elimina de verdad: solo pone
`isActive: false` (borrado logico), asi no se pierde el historial.

Si aun asi quieres agregar un juego al catalogo local de respaldo, abre
`M/modelo.js`, busca la lista `JUEGOS_SEMILLA` y copia un bloque:

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

**Reglas:**
- El `id` nunca debe repetirse.
- `precio` es un numero **en pesos mexicanos (MXN)**, sin el signo `$` ni la
  palabra MXN: el sistema los agrega. Ejemplo: `1399.00` se ve `$1,399.00 MXN`.
- `imagen` usa el helper `portada("archivo.svg")` (ver la seccion 7).
- `plataforma` y `genero` son texto libre. Si escribes uno nuevo, el filtro
  lo agrega automaticamente.

---

## 7. Como cambiar la imagen de un juego

Las portadas de los 13 juegos del catalogo son archivos locales en
`V/assets/` (por ejemplo `assets/the-witcher-3.png`) y se guardan en
Firestore en el campo `coverUrl` tal cual. Ademas, el proyecto tiene un
repositorio de portadas por URL, asi que hay tres opciones:

**Opción A — Usar el repositorio de portadas (recomendado para imagenes por URL):**

1. Sube la nueva portada a la carpeta `portadas/` del repositorio
   `level-up-imagenes` (mira `LEVEL_UP-imagenes/README.md` para publicarlo).
2. En `M/modelo.js` escribe:

```js
imagen: portada("mi-juego.svg")
```

La constante que arma la URL esta en `M/modelo.js`:

```js
const BASE_IMAGENES = "https://cdn.jsdelivr.net/gh/ArtyA14/level-up-imagenes@main/portadas/";
```

**Opción B — Una URL externa cualquiera:**

```js
imagen: "https://midominio.com/imagenes/mi-juego.png"
```

Usa la URL directa de la imagen, no la pagina de Google ni un enlace de
redireccion: esos no cargan como portada.

**Opción C — Imagen local (archivo en tu computadora):**

1. Copia el archivo dentro de `V/assets/`, por ejemplo `V/assets/mi-juego.png`.
2. En `M/modelo.js` escribe la ruta asi:

```js
imagen: "../assets/mi-juego.png"
```

El `../` es necesario porque el HTML se abre desde la carpeta `V`.

**Respaldo automatico:** si la imagen no carga, el motor pone
una imagen de respaldo (`imagenRespaldo`, generada con `placehold.co`), asi
que nunca se ve rota. Esto lo hace la directiva `respaldo` en el HTML:

```html
<img data-bind="src: imagen, alt: titulo, respaldo: imagenRespaldo">
```

Recomendacion: usa imagenes verticales (mas altas que anchas), por ejemplo
300 x 420 pixeles.

---

## 8. Como agregar una plataforma o genero nuevo

No hay que tocar nada mas. Solo escribe el nuevo valor en un juego:

```js
plataforma: "Steam Deck",
genero: "Terror"
```

Los menus de filtros del catalogo se llenan solos con los valores que existan.
En Firestore, `platforms` es una lista (por ejemplo
`["PC", "Xbox Series X/S", "Playstation 5"]`), no un solo texto.

---

## 9. Como cambiar los estilos

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

## 10. Como funciona el login (importante)

El login y el registro **ya no son simulados**: usan **Firebase Auth**
con correo y contrasena.

- Al registrarte, se crea el usuario en Authentication y su perfil en la
  coleccion `users/{uid}`, con `role: "user"`, `level: 1` y `isActive: true`.
- El registro pide usuario, correo y contrasena, y tambien guarda fecha de
  nacimiento (`birthDate`) y pais (`country`) si se escriben.
- Las contrasenas las guarda Firebase (cifradas), no se guardan en el
  codigo ni en `localStorage`.
- El perfil del admin **nunca se sobreescribe** al iniciar sesion: si el
  documento `users/{uid}` ya existe, no se toca, asi el `role: "admin"`
  se mantiene.
- La sesion persiste al recargar la pagina.
- Los usuarios viejos que existian solo en `localStorage` no se migraron:
  tienen que registrarse de nuevo.

### Las colecciones de Firestore

| Coleccion | Que guarda |
|-----------|------------|
| `users/{uid}` | Perfil: username, email, role (`user` o `admin`), level, xp, birthDate, country, isActive. Subcolecciones: `library/{gameId}` y `wishlist/{gameId}`. |
| `games/{gameId}` | Juegos: title, slug, description, developer, publisher, price (MXN), genres[], platforms[], coverUrl, ratingAvg, ratingCount, isFeatured, isActive. |
| `games/{gameId}/reviews/{uid}` | Una resena por usuario por juego (el ID del documento es el UID). |
| `posts/{postId}` | Publicaciones de la comunidad, con subcolecciones `comments` y `likes/{uid}`. |
| `offers/{offerId}` | Ofertas: gameId, oldPrice, newPrice, discountPercent, startDate, endDate, isActive. |
| `purchases/{purchaseId}` | Compras: userId, gameId, pricePaid, offerId, status. |
| `stats/global` y `stats/daily-YYYY-MM-DD` | Contadores para metricas (juegos, compras, ingresos, resenas, posts). |

### Reglas de seguridad (`firestore.rules`)

- Los juegos y las ofertas los puede leer cualquiera, pero **solo el admin**
  los puede crear, editar o borrar.
- Las resenas y los posts los crea quien inicio sesion, y solo su autor
  (o el admin) los puede borrar.
- La biblioteca, la wishlist y las compras solo las ve su dueno (y el admin
  las compras).
- Los contadores de `stats` solo los lee el admin.
- Nunca dejes publicadas las reglas de prueba (`allow read, write: if true`):
  cualquiera podria leer y escribir toda la base. Siempre vuelve a poner
  las reglas reales despues de un seed.

---

## 11. Reglas para colaboradores

1. **No pongas logica en el HTML.** Solo `data-bind`.
2. Si un dato cambia y quieres que la pantalla se actualice solo, guardalo con
   `observable("valor")`.
3. Si un valor se calcula a partir de otros, usa `computed(() => ...)`.
4. Las acciones (lo que pasa al hacer clic) son **metodos** del ViewModel.
5. Para datos del catalogo o de usuarios, usa `GameRepository` y
   `AuthRepository` de `M/modelo.js`, o los modelos de Firestore
   (`M/games.model.js`, `M/offers.model.js`, `M/users.model.js`,
   `M/auth.model.js`). No inventes otro almacenamiento.
6. No reemplaces los archivos del proyecto por un starter nuevo: adapta
   los cambios a la estructura que ya existe (`M/`, `V/`, `MV/` en
   mayusculas, que es como los lee Live Server).
7. Antes de terminar, abre todas las paginas y prueba que todo siga funcionando.

---

## 12. Como probar en tu computadora

1. Abre el proyecto con **Live Server** en VS Code (no con doble clic en
   el `.html`: los `import` de los modelos necesitan un servidor).
2. Entra a `http://127.0.0.1:5500/V/index.html`.
3. Navega entre las paginas con la barra de arriba.
4. Registrate, filtra el catalogo, cierra sesion y vuelve a entrar.
5. Para probar el admin: inicia sesion con la cuenta admin, abre
   `V/admin.html`, crea un juego de prueba y revisa que aparezca en el
   catalogo y en Firestore.

Necesitas internet para Firebase y para las imagenes que vienen por URL.
Si algo no se actualiza, recarga con `Ctrl + Shift + R` (recarga forzada,
sin cache).
