'use strict';

const SOURCES = {
  road: { title: 'SICT · Programa carretero, 2025', badge: 'Parámetro oficial', factor: 3, direct: 1, indirect: 2, url: 'https://www.gob.mx/sict/prensa/proyectos-carreteros-para-2025-generaran-mas-de-150-mil-empleos-sict', description: 'SICT publica 1 empleo directo y 2 indirectos por millón de pesos. Referencia del programa carretero de 2025; sin ajuste por inflación.' },
  water: { title: 'Agua para Campeche · Caso de referencia, 2025', badge: 'Caso de referencia', factor: 3000 / 1400, direct: null, indirect: null, url: 'https://ucs.campeche.gob.mx/la-presidenta-claudia-sheinbaum-pardo-y-la-gobernadora-layda-sansores-san-roman-dieron-el-banderazo-de-inicio-del-proyecto-integral-agua-para-campeche/', description: 'Razón aproximada calculada por esta página: 3,000 empleos ÷ 1,400 mdp. El anuncio utiliza montos aproximados. No es un coeficiente oficial para todo el sector agua, ni ofrece desglose. Sin ajuste por inflación.' },
  general: { title: 'Banobras · Referencia general de infraestructura, 2013', badge: 'Referencia histórica', factor: 4, direct: null, indirect: null, url: 'https://www.gob.mx/banobras/prensa/fundamental-inversion-publico-privada-en-infraestructura-para-cerrar-la-brecha-regional?idiom=es-MX', description: '4 empleos por millón según un comunicado de 2013. Su aplicación a este tipo de obra es una aproximación de esta página, no un parámetro sectorial. No publica desglose ni está actualizado por inflación: no representa automáticamente pesos de 2026.' },
  housing: { title: 'CONAVI · Factores por intervención, 2021', badge: 'Adaptación por costo', url: 'https://siesco.conavi.gob.mx/doc/analisis/2021/Metodologia_del_calculo_de_empleos.pdf#page=37', description: 'Factores por intervención de los programas de vivienda de CONAVI (p. 37). Esta página los convierte a empleos por millón con el costo que tú ingresas. No es un factor monetario oficial ni una actualización del estudio.' }
};
const PROJECTS = {
  movilidad: [
    { id: 'road', name: 'Construcción y modernización de carreteras', source: 'road', hint: 'Obra carretera. Parámetro del programa SICT de 2025.' },
    { id: 'bridge', name: 'Puentes y distribuidores viales', source: 'road', hint: 'Aproximación con el parámetro del programa carretero; no es un factor exclusivo de puentes.' },
    { id: 'transport', name: 'Transporte público y movilidad urbana', source: 'general', hint: 'Infraestructura de obra civil. La referencia general no cubre automáticamente compra de vehículos u operación.' }
  ],
  agua: [
    { id: 'supply', name: 'Abastecimiento y conducción de agua potable', source: 'water', hint: 'Escenario comparable con Agua para Campeche; su intensidad de empleo puede diferir de tu obra.' },
    { id: 'sanitation', name: 'Drenaje y saneamiento', source: 'general', hint: 'Referencia histórica general: no se dispone aquí de un coeficiente específico de saneamiento.' },
    { id: 'hydraulic', name: 'Otra infraestructura hidráulica', source: 'general', hint: 'Obra civil hidráulica con referencia general, no un estándar de Conagua.' }
  ],
  infraestructura: [
    { id: 'housing', name: 'Vivienda y rehabilitación habitacional', source: 'housing', hint: 'Selecciona la intervención y su costo para convertir los factores de CONAVI a empleos por millón.' },
    { id: 'public', name: 'Escuelas, hospitales y edificios públicos', source: 'general', hint: 'Construcción de inmuebles. No estima personal docente, médico o administrativo de operación.' },
    { id: 'spaces', name: 'Parques, espacios públicos y equipamiento urbano', source: 'general', hint: 'Referencia general aplicada a la inversión de obra civil.' },
    { id: 'other', name: 'Otra infraestructura pública', source: 'general', hint: 'Usa la referencia general o documenta un coeficiente propio compatible con tu inversión.' }
  ],
  seguridad: [
    { id: 'stations', name: 'Comisarías y centros de seguridad', source: 'general', hint: 'Solo construcción de instalaciones; no calcula policías, patrullas, armamento ni nómina.' },
    { id: 'civil', name: 'Bomberos y protección civil', source: 'general', hint: 'Solo obra civil. No estima plazas de bomberos, rescatistas ni gastos de operación.' }
  ]
};
const HOUSING = { nueva: 4.5, parcial: 3, ampliacion: 3.5, mejoramiento: 3 };
const $ = id => document.getElementById(id);
const fmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
const precise = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 6 });
const editableNumber = new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: 20 });
const displayJobs = n => n > 0 && n < 0.01 ? '< 0.01' : fmt.format(n);
let category = 'movilidad';
let current = null;
let unit = 'millions';
let scenarios = [];

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
  const custom = $('basis').value === 'custom';
  const housing = !custom && project.source === 'housing';
  const source = SOURCES[project.source];
  $('project-hint').textContent = project.hint;
  $('housing-fields').hidden = !housing;
  $('custom-fields').hidden = !custom;
  $('housing-conversion').hidden = !housing;
  ['investment', 'cost', 'custom-factor', 'custom-source'].forEach(id => $(id).setAttribute('aria-invalid', 'false'));

  let reference = { ...source };
  const errors = [];
  function invalid(id, message) { $(id).setAttribute('aria-invalid', 'true'); errors.push(message); }
  const amount = numberValue($('investment').value, unit === 'millions' ? 1e6 : 1e12);
  const millions = amount === null ? null : amount / (unit === 'pesos' ? 1e6 : 1);
  if (amount === null) invalid('investment', 'Ingresa un monto entre 0 y ' + (unit === 'millions' ? '1,000,000 millones' : '1,000,000,000,000 pesos') + ', con punto decimal y sin comas.');
  $('amount-hint').textContent = millions === null ? 'Usa punto decimal, sin separadores de miles.' : `${fmt.format(millions)} millones = $${fmt.format(millions * 1e6)} MXN. Usa punto decimal, sin separadores de miles.`;

  if (housing) {
    const cost = numberValue($('cost').value);
    const directPerHome = HOUSING[$('intervention').value];
    if (cost === null || cost < 1) invalid('cost', 'Ingresa el costo promedio por intervención: entre 1 y 1,000,000,000,000 pesos.');
    reference.direct = cost >= 1 ? directPerHome * 1e6 / cost : null;
    reference.indirect = cost >= 1 ? 1.5 * 1e6 / cost : null;
    reference.factor = cost >= 1 ? (directPerHome + 1.5) * 1e6 / cost : null;
    $('housing-conversion').textContent = cost >= 1 ? `${fmt.format(directPerHome + 1.5)} empleos por intervención × 1,000,000 ÷ $${fmt.format(cost)} = ${precise.format(reference.factor)} empleos por millón. Costo aportado por el usuario; se conserva la precisión completa al calcular.` : 'Falta tu costo por intervención para obtener el coeficiente por millón.';
  }
  if (custom) {
    const factor = numberValue($('custom-factor').value, 1e6);
    if (factor === null) invalid('custom-factor', 'Ingresa un coeficiente entre 0 y 1,000,000 empleos por millón, sin comas.');
    const attribution = $('custom-source').value.trim();
    if (!attribution) invalid('custom-source', 'Documenta la fuente y el año de tu coeficiente.');
    reference = { factor, direct: null, indirect: null, badge: 'Coeficiente del usuario', title: 'Coeficiente propio · ' + (attribution || 'Fuente pendiente'), description: 'Supuesto aportado por el usuario. Esta página no valida su fuente, año, alcance ni desglose. Asegúrate de que la inversión corresponda a la misma base monetaria.', url: null };
  }
  $('source-title').textContent = reference.title;
  $('source-description').textContent = reference.description + (project.id === 'bridge' && !custom ? ' Para puentes y distribuidores se utiliza como aproximación del programa, no como coeficiente específico.' : '');
  $('evidence-badge').textContent = project.id === 'bridge' && !custom ? 'Aproximación del programa' : reference.badge;
  $('active-source').hidden = !reference.url;
  if (reference.url) $('active-source').href = reference.url;
  $('error').textContent = errors.join(' ');
  current = null;
  const valid = errors.length === 0;
  $('save').disabled = !valid || scenarios.length >= 4;
  const hasBreakdown = reference.direct !== null && reference.direct !== undefined;
  $('breakdown-note').textContent = housing && !valid ? 'Completa los datos para calcular el desglose de CONAVI.' : hasBreakdown ? 'Desglose disponible en la referencia utilizada.' : 'La referencia no permite separar directos e indirectos; no significa que sean cero.';
  $('total').textContent = valid ? displayJobs(reference.factor * millions) : '—';
  $('direct').textContent = valid && hasBreakdown ? displayJobs(reference.direct * millions) : '—';
  $('indirect').textContent = valid && hasBreakdown ? displayJobs(reference.indirect * millions) : '—';
  $('result-context').textContent = valid ? `Con una inversión de ${fmt.format(millions)} millones de pesos` : 'Completa los datos para obtener una estimación.';
  $('equation').textContent = valid ? `${precise.format(reference.factor)} × ${precise.format(millions)} ≈ ${fmt.format(reference.factor * millions)} empleos` : 'Coeficiente × inversión = empleos';
  if (valid) {
    const label = project.name + (housing ? ' · ' + $('intervention').selectedOptions[0].textContent : '');
    current = { label, millions, factor: reference.factor, total: reference.factor * millions, title: reference.title, detail: housing ? $('housing-conversion').textContent : $('source-description').textContent };
  }
}

function renderScenarios() {
  $('comparison').hidden = scenarios.length === 0;
  $('scenario-rows').replaceChildren(...scenarios.map((scenario, index) => {
    const row = document.createElement('tr');
    const name = document.createElement('td'); name.textContent = scenario.label;
    const source = document.createElement('small'); source.textContent = scenario.title;
    const detail = document.createElement('small'); detail.textContent = scenario.detail;
    name.append(source, detail); row.append(name);
    [precise.format(scenario.millions), precise.format(scenario.factor), displayJobs(scenario.total)].forEach(value => {
      const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
    });
    const actions = document.createElement('td');
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Eliminar escenario ' + (index + 1));
    remove.addEventListener('click', () => { scenarios.splice(index, 1); renderScenarios(); update(); $('save').focus(); $('save-status').textContent = 'Escenario eliminado.'; });
    actions.append(remove); row.append(actions);
    return row;
  }));
}

document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  $('basis').value = 'reference'; setProjects();
}));
['project', 'basis', 'intervention'].forEach(id => $(id).addEventListener('change', update));
['investment', 'cost', 'custom-factor', 'custom-source'].forEach(id => $(id).addEventListener('input', update));
$('unit').addEventListener('change', () => {
  const amount = numberValue($('investment').value, unit === 'millions' ? 1e6 : 1e12);
  const next = $('unit').value;
  if (amount !== null && next !== unit) $('investment').value = editableNumber.format(next === 'pesos' ? amount * 1e6 : amount / 1e6);
  unit = next; update();
});
document.querySelectorAll('[data-amount]').forEach(button => button.addEventListener('click', () => {
  $('investment').value = String(Number(button.dataset.amount) * (unit === 'pesos' ? 1e6 : 1)); update();
}));
$('project-form').addEventListener('submit', event => event.preventDefault());
$('save').addEventListener('click', () => {
  if (!current || scenarios.length >= 4) return;
  scenarios.push({ ...current }); renderScenarios(); update();
  $('save-status').textContent = scenarios.length === 4 ? '4 escenarios guardados. Elimina uno para agregar otro.' : `Escenario guardado. ${scenarios.length} de 4 disponibles en la tabla de comparación.`;
});
$('clear').addEventListener('click', () => { scenarios = []; renderScenarios(); update(); $('save').focus(); $('save-status').textContent = 'Se limpiaron los escenarios.'; });
$('print').addEventListener('click', () => window.print());
setProjects();
