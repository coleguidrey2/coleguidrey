const state = { records: [], neighborhoods: null, groups: new Map(), metric: 'tau', query: '', selected: null };
const $ = (id) => document.getElementById(id);
const number = (value) => Number.parseFloat(value) || 0;
const money = (value) => value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : '-';
const percent = (value) => value ? `${(value * 100).toFixed(1)}%` : '-';
const median = (values) => { const sorted = values.filter(Number.isFinite).sort((a, b) => a - b); if (!sorted.length) return 0; const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; };

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(field); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) { if (character === '\r' && text[index + 1] === '\n') index += 1; row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ''; }
    else field += character;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

async function loadCsv() {
  const response = await fetch('public/master.csv.gz');
  if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
  const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
  return parseCsv(await new Response(stream).text());
}

function aggregate(records) {
  const groups = new Map();
  records.forEach(record => {
    const name = record.neighborhood || 'Unknown';
    if (!groups.has(name)) groups.set(name, { name, count: 0, land: [], total: [], tau: [], vacant: 0 });
    const group = groups.get(name);
    group.count += 1;
    if (number(record.land_value)) group.land.push(number(record.land_value));
    if (number(record.total_value)) group.total.push(number(record.total_value));
    if (number(record.tau_optimal)) group.tau.push(number(record.tau_optimal));
    if (record.vacant === 'True') group.vacant += 1;
  });
  groups.forEach(group => { group.avgLand = group.land.length ? group.land.reduce((a, b) => a + b, 0) / group.land.length : 0; group.avgTotal = group.total.length ? group.total.reduce((a, b) => a + b, 0) / group.total.length : 0; group.avgTau = group.tau.length ? group.tau.reduce((a, b) => a + b, 0) / group.tau.length : 0; });
  return groups;
}

function coordinates(geometry) { const output = []; const walk = (value) => { if (typeof value[0] === 'number') output.push(value); else value.forEach(walk); }; walk(geometry.coordinates); return output; }
function drawMap() {
  const features = state.neighborhoods.features;
  const points = features.flatMap(feature => coordinates(feature.geometry));
  const minLon = Math.min(...points.map(point => point[0])); const maxLon = Math.max(...points.map(point => point[0]));
  const minLat = Math.min(...points.map(point => point[1])); const maxLat = Math.max(...points.map(point => point[1]));
  const project = ([lon, lat]) => [((lon - minLon) / (maxLon - minLon)) * 960 + 20, 580 - ((lat - minLat) / (maxLat - minLat)) * 560];
  const pathData = (geometry) => { const makeRing = ring => `${ring.map((point, index) => `${index ? 'L' : 'M'}${project(point).join(' ')}`).join('')}Z`; return geometry.type === 'Polygon' ? geometry.coordinates.map(makeRing).join(' ') : geometry.coordinates.map(polygon => polygon.map(makeRing).join(' ')).join(' '); };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 1000 600');
  features.forEach(feature => { const name = feature.properties.hood; const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.dataset.name = name; path.setAttribute('d', pathData(feature.geometry)); path.addEventListener('click', () => selectNeighborhood(name)); svg.appendChild(path); });
  $('map').replaceChildren(svg); updateMap();
}
function valueFor(group) { return state.metric === 'land' ? group.avgLand : state.metric === 'total' ? group.avgTotal : group.avgTau; }
function colorFor(value, min, max) { const ratio = max === min ? .5 : (value - min) / (max - min); const light = 94 - ratio * 52; return `hsl(157 45% ${light}%)`; }
function updateMap() {
  const groups = [...state.groups.values()]; const values = groups.map(valueFor).filter(Boolean); const min = Math.min(...values); const max = Math.max(...values); const query = state.query.toLowerCase();
  document.querySelectorAll('#map path').forEach(path => { const group = state.groups.get(path.dataset.name); path.style.fill = group ? colorFor(valueFor(group), min, max) : '#e0e6e1'; path.classList.toggle('selected', state.selected === path.dataset.name); path.classList.toggle('dimmed', Boolean(query) && !path.dataset.name.toLowerCase().includes(query)); });
  $('legend-low').textContent = state.metric === 'tau' ? percent(min) : money(min); $('legend-high').textContent = state.metric === 'tau' ? percent(max) : money(max);
}
function selectNeighborhood(name) { state.selected = name; const group = state.groups.get(name); if (!group) return; $('selected-name').textContent = name; $('selected-note').textContent = `${group.count.toLocaleString()} records in the property dataset.`; $('selected-properties').textContent = group.count.toLocaleString(); $('selected-land').textContent = money(group.avgLand); $('selected-total').textContent = money(group.avgTotal); $('selected-rate').textContent = percent(group.avgTau); $('selected-vacant').textContent = `${group.vacant.toLocaleString()} (${percent(group.vacant / group.count)})`; renderTable(); updateMap(); }
function renderTable() { const query = state.query.toLowerCase(); const groups = [...state.groups.values()].filter(group => group.name.toLowerCase().includes(query)).sort((a, b) => b.count - a.count); $('table-note').textContent = `${groups.length} neighborhoods`; $('results').innerHTML = groups.map(group => `<tr class="${group.name === state.selected ? 'selected' : ''}" data-name="${group.name.replaceAll('"', '&quot;')}"><td><strong>${group.name}</strong></td><td>${group.count.toLocaleString()}</td><td>${money(group.avgLand)}</td><td>${money(group.avgTotal)}</td><td>${percent(group.avgTau)}</td><td>${group.vacant.toLocaleString()}</td></tr>`).join(''); document.querySelectorAll('#results tr').forEach(row => row.addEventListener('click', () => selectNeighborhood(row.dataset.name))); }
function renderStats() { const records = state.records; $('property-count').textContent = records.length.toLocaleString(); $('neighborhood-count').textContent = state.groups.size.toLocaleString(); $('land-median').textContent = money(median(records.map(record => number(record.land_value)).filter(Boolean))); $('rate-median').textContent = percent(median(records.map(record => number(record.tau_optimal)).filter(Boolean))); $('map-note').textContent = `${state.groups.size} mapped areas`; }
async function init() { try { const [records, neighborhoods] = await Promise.all([loadCsv(), fetch('public/neighborhoods.geojson').then(response => response.json())]); state.records = records; state.neighborhoods = neighborhoods; state.groups = aggregate(records); renderStats(); drawMap(); renderTable(); } catch (error) { $('map-note').textContent = 'Unable to load dataset'; $('results').innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`; } }
$('search').addEventListener('input', event => { state.query = event.target.value.trim(); renderTable(); updateMap(); });
$('metric').addEventListener('change', event => { state.metric = event.target.value; updateMap(); });
$('reset').addEventListener('click', () => { state.query = ''; state.selected = null; $('search').value = ''; $('selected-name').textContent = 'Choose a neighborhood'; $('selected-note').textContent = 'Select a shape on the map or a row below.'; ['selected-properties', 'selected-land', 'selected-total', 'selected-rate', 'selected-vacant'].forEach(id => { $(id).textContent = '-'; }); renderTable(); updateMap(); });
init();
