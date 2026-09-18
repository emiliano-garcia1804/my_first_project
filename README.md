# Calculadora de empleo para infraestructura

Calculadora en español de empleo asociado a obras públicas. Sitio estático compatible con GitHub Pages; no necesita compilación.

## Uso local

Abre `index.html` en un navegador, o ejecuta `python -m http.server 8765 --bind 127.0.0.1` y visita `http://127.0.0.1:8765`.

Publica juntos `index.html`, `styles.css` y `app.js`. Las fuentes de Google son opcionales; hay fuentes del sistema como respaldo.

## Cálculo

- Movilidad: Calles u Otros proyectos de movilidad, con inversión en millones de pesos.
- Agua: Obras en infraestructura hidráulica, con inversión en millones de pesos.
- Infraestructura: Obra de infraestructura pública, con inversión en millones de pesos.
- Vivienda: número de viviendas y tipo de intervención, sin costo ni inversión.

Calles utiliza como aproximación el parámetro carretero SICT (2025): 1 empleo directo y 2 indirectos por millón de pesos. No se convierte a kilómetros sin una referencia compatible.

Otros proyectos de movilidad e infraestructura pública usan la referencia general histórica de Banobras (2013): 4 empleos por millón, sin desglose ni ajuste por inflación. No es un coeficiente específico para movilidad urbana o infraestructura hidráulica. Agua utiliza el caso Agua para Campeche (2025): 3,000 / 1,400 empleos por millón, sin redondear el coeficiente. Su aplicación a otras obras hidráulicas es una aproximación, no un parámetro sectorial.

Vivienda multiplica el número de viviendas por los factores CONAVI (2021, p. 37): 4.5 directos en vivienda nueva, 3 en reconstrucción parcial, 3.5 en ampliación y 3 en mejoramiento; 1.5 indirectos en las cuatro intervenciones.

No se envían datos a un servidor. La interfaz no incluye coeficientes propios, comparación de escenarios ni botón de impresión.

## Verificación

Con Node.js 22 o posterior: `npm ci` y `npm test`. Las pruebas cubren cálculos, entradas inválidas, modalidades de vivienda, cambios de categoría, referencias y controles accesibles.

## Mantenimiento

Los coeficientes y tipos de proyecto están en `app.js`, en `SOURCES`, `PROJECTS` y `HOUSING`. Al actualizar una referencia, ajusta también la ficha de `index.html` y verifica las pruebas.
