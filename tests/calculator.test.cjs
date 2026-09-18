const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { JSDOM } = require('jsdom');
const root = resolve(__dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const script = readFileSync(resolve(root, 'app.js'), 'utf8');

function setup(t) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
  t.after(() => dom.window.close());
  dom.window.eval(script);
  const get = id => dom.window.document.getElementById(id);
  const set = (id, value) => {
    get(id).value = value;
    get(id).dispatchEvent(new dom.window.Event(get(id).tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };
  const category = value => dom.window.document.querySelector(`[data-category="${value}"]`).click();
  return { dom, get, set, category };
}

test('Calles calcula empleo por inversión y rechaza entradas inválidas', t => {
  const { get, set } = setup(t);
  assert.equal(get('total').textContent, '300');
  assert.equal(get('direct').textContent, '100');
  assert.equal(get('indirect').textContent, '200');
  for (const value of ['', '-1', '1,000', 'NaN', 'Infinity', '1e3', '1000001']) {
    set('investment', value);
    assert.equal(get('total').textContent, '—');
    assert.equal(get('investment').getAttribute('aria-invalid'), 'true');
  }
  set('investment', '0');
  assert.equal(get('total').textContent, '0');
  set('investment', '0.001');
  assert.equal(get('total').textContent, '< 0.01');
});

test('Categorías simplificadas conservan sus referencias y unidades', t => {
  const { get, set, category } = setup(t);
  assert.equal(get('project').options.length, 2);
  set('project', 'transport');
  assert.equal(get('total').textContent, '400');
  assert.match(get('source-title').textContent, /Banobras/);
  assert.equal(get('direct').textContent, '—');
  for (const [key, title] of [['agua', 'Obras en infraestructura hidráulica'], ['infraestructura', 'Obra de infraestructura pública']]) {
    category(key);
    assert.equal(get('input-title').textContent, title);
    assert.equal(get('project-fields').hidden, true);
    assert.equal(get('investment-fields').hidden, false);
    assert.equal(get('total').textContent, key === 'agua' ? '214.29' : '400');
    assert.match(get('evidence-badge').textContent, key === 'agua' ? /Caso de referencia/ : /histórica/);
  }
});

test('Vivienda calcula las cuatro intervenciones e ignora la inversión oculta', t => {
  const { get, set, category } = setup(t);
  set('investment', 'invalid');
  category('vivienda');
  assert.equal(get('investment-fields').hidden, true);
  set('homes', '20');
  for (const [type, direct, total] of [['nueva', '90', '120'], ['parcial', '60', '90'], ['ampliacion', '70', '100'], ['mejoramiento', '60', '90']]) {
    set('intervention', type);
    assert.equal(get('direct').textContent, direct);
    assert.equal(get('indirect').textContent, '30');
    assert.equal(get('total').textContent, total);
  }
  assert.match(get('equation-units').textContent, /viviendas/);
  for (const value of ['', '-1', '2.5', '1,000', '1000001']) {
    set('homes', value);
    assert.equal(get('total').textContent, '—');
    assert.equal(get('homes').getAttribute('aria-invalid'), 'true');
  }
  set('homes', '0');
  assert.equal(get('total').textContent, '0');
  category('movilidad');
  assert.equal(get('total').textContent, '—');
  set('investment', '100');
  assert.equal(get('total').textContent, '300');
  assert.equal(get('housing-fields').hidden, true);
  assert.match(get('equation-units').textContent, /millón/);
});

test('Controles eliminados no aparecen y etiquetas y enlaces siguen conectados', t => {
  const { dom, get } = setup(t);
  for (const id of ['basis', 'custom-source', 'custom-factor', 'save', 'print', 'comparison', 'unit', 'cost']) assert.equal(get(id), null);
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('[data-amount]').length, 0);
  const ids = [...doc.querySelectorAll('[id]')].map(element => element.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const link of doc.querySelectorAll('a[href^="#"]')) assert.ok(get(link.hash.slice(1)), link.hash);
  for (const control of doc.querySelectorAll('input,select')) assert.ok(control.hasAttribute('aria-label') || doc.querySelector(`label[for="${control.id}"]`), control.id);
});

test('Agua conserva la referencia de Campeche y su precisión; calles identifica la aproximación', t => {
  const { get, set, category } = setup(t);
  assert.equal(get('project').selectedOptions[0].textContent, 'Calles');
  assert.match(get('source-description').textContent, /aproximación/);
  category('agua');
  set('investment', '1400');
  assert.equal(get('total').textContent, '3,000');
  assert.equal(get('direct').textContent, '—');
  assert.match(get('source-title').textContent, /Agua para Campeche/);
  assert.match(get('active-source').href, /ucs.campeche.gob.mx/);
});
