# Obra y empleo

Calculadora en español de empleo asociado a inversión pública en México. Sitio estático compatible con GitHub Pages; no necesita compilación.

## Uso local

Abre `index.html` en un navegador, o ejecuta `python -m http.server 8765 --bind 127.0.0.1` y visita `http://127.0.0.1:8765`.

Publica juntos `index.html`, `styles.css` y `app.js` en la carpeta configurada en GitHub Pages. Las fuentes tipográficas de Google son opcionales: hay fuentes del sistema como respaldo.

## Alcance del cálculo

La operación principal siempre es **empleos por millón × inversión en millones = empleos estimados**. Las cuatro categorías incluyen 12 tipos de proyecto. La página documenta fuentes, año, alcance y limitaciones junto a los resultados.

- SICT (2025): 1 directo + 2 indirectos por millón para infraestructura carretera. Puentes usa este parámetro como aproximación del programa.
- Agua para Campeche (2025): razón aproximada de 3,000 empleos / 1,400 mdp, calculada por esta página a partir del anuncio del proyecto. No es un coeficiente sectorial de Conagua.
- CONAVI (2021), p. 37: factores por intervención convertidos a empleos por millón mediante un costo promedio ingresado por el usuario. Se conservan las cuatro modalidades originales.
- Banobras (2013): 4 empleos por millón como referencia histórica general, sin desglose. Su aplicación a otros sectores es una aproximación, sin actualización por inflación.
- Coeficiente propio: permite modelar otras inversiones con atribución y año aportados por el usuario.

No se inventan desgloses donde la fuente no los publica. No se modelan inflación, empleos-año, personal de operación ni efectos netos. No se extrapolan factores universales por m² o km. Las referencias completas están enlazadas en la página.

Los escenarios comparados se conservan en memoria hasta recargar la página y no se suman. No se envían los datos del cálculo a un servidor.

## Verificación

Con Node.js 22 o posterior: `npm ci` y `npm test`. Las dependencias son únicamente para pruebas; no se necesitan para servir el sitio. Las pruebas cubren las fórmulas, unidades, entradas inválidas, modalidades de vivienda, fuentes, comparación, texto del usuario y controles básicos de accesibilidad. No sustituyen una revisión visual en navegador.

## Mantenimiento

Los coeficientes y tipos de proyecto están en `app.js`, en `SOURCES`, `PROJECTS` y `HOUSING`. Al actualizar una referencia, ajusta también la explicación y la ficha correspondiente en `index.html`, y verifica las pruebas. Evita presentar un comunicado histórico o una razón de un proyecto como metodología universal o coeficiente actualizado.
