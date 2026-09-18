'use strict';

const SOURCES = {
  water: { title: 'Agua para Campeche · Caso de referencia, 2025', badge: 'Caso de referencia', factor: 3000 / 1400, direct: null, indirect: null, url: 'https://ucs.campeche.gob.mx/la-presidenta-claudia-sheinbaum-pardo-y-la-gobernadora-layda-sansores-san-roman-dieron-el-banderazo-de-inicio-del-proyecto-integral-agua-para-campeche/', description: 'Razón aproximada calculada por esta página: 3,000 empleos ÷ 1,400 mdp. El anuncio utiliza montos aproximados. Su aplicación a otras obras hidráulicas es una aproximación; no es un coeficiente oficial para todo el sector agua ni ofrece desglose. Sin ajuste por inflación.' },
  road: { title: 'SICT · Programa carretero, 2025', badge: 'Aproximación para calles', factor: 3, direct: 1, indirect: 2, url: 'https://www.gob.mx/sict/prensa/proyectos-carreteros-para-2025-generaran-mas-de-150-mil-empleos-sict', description: 'SICT publica 1 empleo directo y 2 indirectos por millón de pesos. Referencia del programa carretero de 2025. Su aplicación a calles es una aproximación, no un coeficiente específico de vialidades urbanas. Sin ajuste por inflación.' },
  general: { title: 'Banobras · Referencia general de infraestructura, 2013', badge: 'Referencia histórica', factor: 4, direct: null, indirect: null, url: 'https://www.gob.mx/banobras/prensa/fundamental-inversion-publico-privada-en-infraestructura-para-cerrar-la-brecha-regional?idiom=es-MX', description: '4 empleos por millón según un comunicado de 2013. Su aplicación a este tipo de obra es una aproximación de esta página, no un parámetro sectorial. No publica desglose ni está actualizado por inflación: no representa automáticamente pesos de 2026.' },
  housing: { title: 'CONAVI · Factores por intervención, 2021', badge: 'Factor por vivienda', url: 'https://siesco.conavi.gob.mx/doc/analisis/2021/Metodologia_del_calculo_de_empleos.pdf#page=37', description: 'Factores por intervención de los programas de vivienda de CONAVI (p. 37). Se multiplican los factores de la intervención seleccionada por el número de viviendas. No es un factor monetario ni una actualización del estudio.' }
};
const PROJECTS = {
  movilidad: [
    { id: 'road', name: 'Calles', source: 'road' },
    { id: 'transport', name: 'Otros proyectos de movilidad', source: 'general' }
  ],
  agua: [{ id: 'hydraulic', name: 'Obras en infraestructura hidráulica', source: 'water' }],
  vivienda: [{ id: 'housing', name: 'Vivienda', source: 'housing' }],
  infraestructura: [{ id: 'public', name: 'Obra de infraestructura pública', source: 'general' }]
};
const HOUSING = { nueva: 4.5, parcial: 3, ampliacion: 3.5, mejoramiento: 3 };
const $ = id => document.getElementById(id);
const fmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
const precise = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 6 });
const displayJobs = n => n > 0 && n < 0.01 ? '< 0.01' : fmt.format(n);
let category = 'movilidad';

function numberValue(raw, max = 1e12) {
  const text = raw.trim();
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

function setProjects() {
  $('project').replaceChildren(...PROJECTS[category].map(project => {
    const option = document.createElement('option');
    option.value = project.id; option.textContent = project.name;
    return option;
  }));
  update();
}

function update() {
  const project = PROJECTS[category].find(item => item.id === $('project').value);
  const housing = project.source === 'housing';
  const source = SOURCES[project.source];
  $('housing-fields').hidden = !housing;
  $('project-fields').hidden = category !== 'movilidad';
  $('investment-fields').hidden = housing;
  $('input-title').textContent = category === 'movilidad' ? 'Movilidad' : project.name;
  $('input-unit').textContent = housing ? 'Número de viviendas' : 'Pesos mexicanos';
  $('equation-units').textContent = housing ? 'empleos por vivienda × número de viviendas' : 'empleos por millón × inversión en millones';
  $('formula-expression').textContent = housing ? 'Coeficiente de empleo × viviendas' : 'Coeficiente de empleo × inversión';
  $('formula-note').textContent = housing ? 'Factor de empleo por vivienda según la intervención seleccionada.' : 'Coeficiente expresado en empleos por millón de pesos e inversión en millones de pesos.';
  ['investment', 'homes'].forEach(id => $(id).setAttribute('aria-invalid', 'false'));

  let reference = { ...source };
  const errors = [];
  function invalid(id, message) { $(id).setAttribute('aria-invalid', 'true'); errors.push(message); }
  const millions = numberValue($('investment').value, 1e6);
  if (!housing && millions === null) invalid('investment', 'Ingresa un monto entre 0 y 1,000,000 millones de pesos, con punto decimal y sin comas.');
  $('amount-hint').textContent = millions === null ? 'Usa punto decimal, sin separadores de miles.' : `${fmt.format(millions)} millones = $${fmt.format(millions * 1e6)} MXN.`;
  let quantity = millions;
  if (housing) {
    quantity = numberValue($('homes').value, 1e6);
    if (quantity === null || !Number.isInteger(quantity)) invalid('homes', 'Ingresa un número entero de viviendas entre 0 y 1,000,000, sin comas.');
    reference.direct = HOUSING[$('intervention').value];
    reference.indirect = 1.5;
    reference.factor = reference.direct + reference.indirect;
  }
  $('source-title').textContent = reference.title;
  $('source-description').textContent = reference.description;
  $('evidence-badge').textContent = reference.badge;
  $('active-source').hidden = !reference.url;
  if (reference.url) $('active-source').href = reference.url;
  $('error').textContent = errors.join(' ');
  const valid = errors.length === 0;
  const hasBreakdown = reference.direct !== null && reference.direct !== undefined;
  $('breakdown-note').textContent = housing && !valid ? 'Completa los datos para calcular el desglose de CONAVI.' : hasBreakdown ? 'Desglose disponible en la referencia utilizada.' : 'La referencia no permite separar directos e indirectos; no significa que sean cero.';
  $('total').textContent = valid ? displayJobs(reference.factor * quantity) : '—';
  $('direct').textContent = valid && hasBreakdown ? displayJobs(reference.direct * quantity) : '—';
  $('indirect').textContent = valid && hasBreakdown ? displayJobs(reference.indirect * quantity) : '—';
  $('result-context').textContent = valid ? (housing ? `${fmt.format(quantity)} viviendas · ${$('intervention').selectedOptions[0].textContent}` : `Con una inversión de ${fmt.format(millions)} millones de pesos`) : 'Completa los datos para obtener una estimación.';
  $('equation').textContent = valid ? `${precise.format(reference.factor)} × ${precise.format(quantity)} ≈ ${fmt.format(reference.factor * quantity)} empleos` : (housing ? 'Coeficiente × viviendas = empleos' : 'Coeficiente × inversión = empleos');
}

document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  setProjects();
}));
['project', 'intervention'].forEach(id => $(id).addEventListener('change', update));
['investment', 'homes'].forEach(id => $(id).addEventListener('input', update));
$('project-form').addEventListener('submit', event => event.preventDefault());
setProjects();
