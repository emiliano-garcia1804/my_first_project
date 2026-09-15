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

test('Carreteras: 100 mdp produce 100 directos, 200 indirectos y 300 totales', t => {
  const { get } = setup(t);
  assert.equal(get('total').textContent, '300');
  assert.equal(get('direct').textContent, '100');
  assert.equal(get('indirect').textContent, '200');
});

test('Cambiar unidades conserva la inversión, incluso con centavos', t => {
  const { get, set } = setup(t);
  set('unit', 'pesos');
  assert.equal(get('investment').value, '100000000');
  assert.equal(get('total').textContent, '300');
  set('investment', '0.01');
  set('unit', 'millions');
  assert.equal(get('investment').value, '0.00000001');
  assert.equal(get('error').textContent, '');
  assert.equal(get('total').textContent, '< 0.01');
  set('unit', 'pesos');
  assert.equal(get('investment').value, '0.01');
});

test('Rechaza montos ambiguos, negativos, vacíos y fuera de rango; acepta cero', t => {
  const { get, set } = setup(t);
  for (const value of ['', '-1', '1,000', 'NaN', 'Infinity', '1e3', '1000001', '12abc']) {
    set('investment', value);
    assert.equal(get('total').textContent, '—', value);
    assert.equal(get('save').disabled, true, value);
    assert.equal(get('investment').getAttribute('aria-invalid'), 'true', value);
  }
  set('investment', '0');
  assert.equal(get('total').textContent, '0');
  assert.equal(get('save').disabled, false);
});

test('Agua conserva la razón completa: 1,400 mdp equivale a 3,000 empleos', t => {
  const { get, set, category } = setup(t);
  category('agua'); set('investment', '1400');
  assert.equal(get('total').textContent, '3,000');
  assert.equal(get('direct').textContent, '—');
  assert.equal(get('indirect').textContent, '—');
  assert.match(get('evidence-badge').textContent, /Caso de referencia/);
  set('project', 'sanitation');
  assert.equal(get('total').textContent, '5,600');
  assert.match(get('source-title').textContent, /2013/);
});

test('CONAVI necesita costo y conserva las cuatro modalidades originales', t => {
  const { get, set, category } = setup(t);
  category('infraestructura');
  assert.equal(get('total').textContent, '—');
  set('cost', '0'); assert.equal(get('total').textContent, '—');
  set('cost', '500000'); set('investment', '10');
  for (const [type, direct, total] of [['nueva', '90', '120'], ['parcial', '60', '90'], ['ampliacion', '70', '100'], ['mejoramiento', '60', '90']]) {
    set('intervention', type);
    assert.equal(get('direct').textContent, direct);
    assert.equal(get('indirect').textContent, '30');
    assert.equal(get('total').textContent, total);
  }
  set('project', 'public');
  assert.equal(get('housing-fields').hidden, true);
  assert.equal(get('direct').textContent, '—');
});

test('Seguridad expone referencia histórica; puentes identifican la aproximación', t => {
  const { get, set, category } = setup(t);
  category('seguridad');
  assert.equal(get('total').textContent, '400');
  assert.match(get('evidence-badge').textContent, /histórica/);
  assert.match(get('source-description').textContent, /2013/);
  assert.equal(get('direct').textContent, '—');
  category('movilidad'); set('project', 'bridge');
  assert.match(get('evidence-badge').textContent, /Aproximación/);
});

test('Coeficiente propio requiere atribución y trata el texto como datos', t => {
  const { dom, get, set } = setup(t);
  set('basis', 'custom'); set('custom-factor', '3.5');
  assert.equal(get('total').textContent, '—');
  const attribution = '<img src=x onerror=alert(1)> Estudio local, 2026';
  set('custom-source', attribution);
  assert.equal(get('total').textContent, '350');
  assert.equal(get('active-source').hidden, true);
  assert.equal(get('direct').textContent, '—');
  get('save').click();
  assert.match(get('scenario-rows').textContent, /Estudio local, 2026/);
  assert.equal(dom.window.document.querySelectorAll('img').length, 0);
  set('custom-factor', '0'); assert.equal(get('total').textContent, '0');
});

test('Comparación conserva resultados, limita a cuatro y permite eliminar y limpiar', t => {
  const { get, set } = setup(t);
  get('save').click();
  set('investment', '200');
  assert.equal(get('scenario-rows').children[0].children[3].textContent, '300');
  get('save').click(); get('save').click(); get('save').click();
  assert.equal(get('scenario-rows').children.length, 4);
  assert.equal(get('save').disabled, true);
  get('scenario-rows').querySelector('button').click();
  assert.equal(get('save').disabled, false);
  assert.equal(get('scenario-rows').children.length, 3);
  get('clear').click();
  assert.equal(get('comparison').hidden, true);
});

test('Todos los proyectos producen resultados finitos con los datos necesarios', t => {
  const { dom, get, set, category } = setup(t);
  for (const button of dom.window.document.querySelectorAll('[data-category]')) {
    category(button.dataset.category);
    for (const option of [...get('project').options]) {
      set('project', option.value);
      if (option.value === 'housing') set('cost', '500000');
      assert.equal(get('error').textContent, '', option.value);
      assert.doesNotMatch(get('total').textContent, /NaN|Infinity|—/, option.value);
    }
  }
});

test('Impresión, etiquetas y enlaces internos están conectados', t => {
  const { dom, get } = setup(t);
  let printed = false; dom.window.print = () => { printed = true; };
  get('print').click(); assert.equal(printed, true);
  const doc = dom.window.document;
  const ids = [...doc.querySelectorAll('[id]')].map(element => element.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const link of doc.querySelectorAll('a[href^="#"]')) assert.ok(get(link.hash.slice(1)), link.hash);
  for (const control of doc.querySelectorAll('input,select')) assert.ok(control.hasAttribute('aria-label') || doc.querySelector(`label[for="${control.id}"]`), control.id);
});
