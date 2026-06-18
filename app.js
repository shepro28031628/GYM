/* ============================================================
   GymPro - Application Logic
   ============================================================ */

// ===================== DATA STORE =====================
let DB = {
  usuarios: [],
  rutinas: [],   // { id, usuarioId, mes, anio, tipo, dias, pesoIni, pesoFin, ejercicios[], notas }
  progresos: [], // { id, usuarioId, fecha, peso, pecho, cintura, cadera, brazoIzq, brazoDer, musloIzq, musloDer, pantorrilla, notas }
};

function loadDB() {
  try {
    const saved = localStorage.getItem('gymproDB');
    if (saved) DB = JSON.parse(saved);
  } catch(e) { console.warn('No se pudo cargar la base de datos.'); }
}

function saveDB() {
  localStorage.setItem('gymproDB', JSON.stringify(DB));
}

// ===================== UTILS =====================
let _idCounter = Date.now();
function genId() { return (++_idCounter).toString(36); }

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3200);
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function avatarClass(name) {
  const colors = ['av-0','av-1','av-2','av-3','av-4','av-5'];
  let code = 0;
  for (let c of name) code += c.charCodeAt(0);
  return colors[code % colors.length];
}

function initials(name) {
  return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
}

function badgeClass(nivel) {
  return { 'Principiante': 'badge-principiante', 'Intermedio': 'badge-intermedio', 'Avanzado': 'badge-avanzado' }[nivel] || 'badge-principiante';
}

function bmi(peso, estatura) {
  if (!peso || !estatura) return '—';
  const bmi = peso / ((estatura / 100) ** 2);
  return bmi.toFixed(1);
}

function bmiCategory(b) {
  const v = parseFloat(b);
  if (isNaN(v)) return '';
  if (v < 18.5) return 'Bajo peso';
  if (v < 25)   return 'Normal';
  if (v < 30)   return 'Sobrepeso';
  return 'Obesidad';
}

// ===================== NAVIGATION =====================
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  document.getElementById(`nav-${name}`).classList.add('active');
  document.getElementById('topbar-title').textContent = {
    dashboard: 'Dashboard',
    usuarios: 'Usuarios',
    rutinas: 'Rutinas Mensuales',
    progreso: 'Seguimiento de Progreso',
    recetas: 'Nutrición y Recetas',
  }[name] || name;

  const btnNuevo = document.getElementById('btn-nuevo-usuario');
  if (btnNuevo) btnNuevo.style.display = name === 'usuarios' ? 'flex' : 'none';

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }

  if (name === 'dashboard') renderDashboard();
  if (name === 'usuarios') renderUsuarios();
  if (name === 'rutinas') populateUsuarioSelects();
  if (name === 'progreso') populateUsuarioSelects();
  if (name === 'recetas') renderRecetas('todas');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===================== MODALS =====================
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) closeModal(this.id);
  });
});

// ===================== USUARIOS =====================
function openModalUsuario(usuarioId = null) {
  const form = document.getElementById('form-usuario');
  form.reset();
  document.getElementById('usuario-id').value = '';
  document.getElementById('modal-usuario-title').textContent = 'Nuevo Usuario';

  if (usuarioId) {
    const u = DB.usuarios.find(x => x.id === usuarioId);
    if (!u) return;
    document.getElementById('modal-usuario-title').textContent = 'Editar Usuario';
    document.getElementById('usuario-id').value = u.id;
    document.getElementById('u-nombre').value = u.nombre;
    document.getElementById('u-edad').value = u.edad;
    document.getElementById('u-genero').value = u.genero;
    document.getElementById('u-email').value = u.email || '';
    document.getElementById('u-telefono').value = u.telefono || '';
    document.getElementById('u-peso').value = u.peso;
    document.getElementById('u-estatura').value = u.estatura;
    document.getElementById('u-pecho').value = u.pecho || '';
    document.getElementById('u-cintura').value = u.cintura || '';
    document.getElementById('u-cadera').value = u.cadera || '';
    document.getElementById('u-brazo-izq').value = u.brazoIzq || '';
    document.getElementById('u-brazo-der').value = u.brazoDer || '';
    document.getElementById('u-muslo-izq').value = u.musloIzq || '';
    document.getElementById('u-muslo-der').value = u.musloDer || '';
    document.getElementById('u-pantorrilla').value = u.pantorrilla || '';
    document.getElementById('u-objetivo').value = u.objetivo;
    document.getElementById('u-nivel').value = u.nivel;
    document.getElementById('u-obs').value = u.obs || '';
  }

  openModal('modal-usuario');
}

function guardarUsuario(e) {
  e.preventDefault();
  const id = document.getElementById('usuario-id').value;
  const usuario = {
    id: id || genId(),
    nombre: document.getElementById('u-nombre').value.trim(),
    edad: parseInt(document.getElementById('u-edad').value),
    genero: document.getElementById('u-genero').value,
    email: document.getElementById('u-email').value.trim(),
    telefono: document.getElementById('u-telefono').value.trim(),
    peso: parseFloat(document.getElementById('u-peso').value),
    estatura: parseFloat(document.getElementById('u-estatura').value),
    pecho: parseFloat(document.getElementById('u-pecho').value) || null,
    cintura: parseFloat(document.getElementById('u-cintura').value) || null,
    cadera: parseFloat(document.getElementById('u-cadera').value) || null,
    brazoIzq: parseFloat(document.getElementById('u-brazo-izq').value) || null,
    brazoDer: parseFloat(document.getElementById('u-brazo-der').value) || null,
    musloIzq: parseFloat(document.getElementById('u-muslo-izq').value) || null,
    musloDer: parseFloat(document.getElementById('u-muslo-der').value) || null,
    pantorrilla: parseFloat(document.getElementById('u-pantorrilla').value) || null,
    objetivo: document.getElementById('u-objetivo').value,
    nivel: document.getElementById('u-nivel').value,
    obs: document.getElementById('u-obs').value.trim(),
    creado: id ? (DB.usuarios.find(x => x.id === id)?.creado || new Date().toISOString()) : new Date().toISOString(),
  };

  if (id) {
    const idx = DB.usuarios.findIndex(x => x.id === id);
    if (idx >= 0) DB.usuarios[idx] = usuario;
  } else {
    DB.usuarios.push(usuario);
  }

  saveDB();
  closeModal('modal-usuario');
  renderUsuarios();
  renderDashboard();
  populateUsuarioSelects();
  showToast(id ? '✅ Usuario actualizado' : '✅ Usuario registrado correctamente');
}

function eliminarUsuario(id) {
  if (!confirm('¿Eliminar este usuario? Se borrarán también sus rutinas y progresos.')) return;
  DB.usuarios = DB.usuarios.filter(u => u.id !== id);
  DB.rutinas = DB.rutinas.filter(r => r.usuarioId !== id);
  DB.progresos = DB.progresos.filter(p => p.usuarioId !== id);
  saveDB();
  renderUsuarios();
  renderDashboard();
  populateUsuarioSelects();
  showToast('🗑️ Usuario eliminado', 'error');
}

function verPerfil(id) {
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;
  const b = bmi(u.peso, u.estatura);
  const avClass = avatarClass(u.nombre);
  const ini = initials(u.nombre);

  const html = `
    <div class="perfil-hero">
      <div class="perfil-avatar ${avClass}">${ini}</div>
      <div>
        <div class="perfil-name">${u.nombre}</div>
        <div class="perfil-meta">${u.edad} años · ${u.genero} · ${u.nivel} · 🎯 ${u.objetivo}</div>
        ${u.email ? `<div class="perfil-meta" style="margin-top:4px">📧 ${u.email}${u.telefono ? ' · 📱 ' + u.telefono : ''}</div>` : ''}
      </div>
    </div>
    <div class="perfil-body">
      <div class="medidas-grid">
        <div class="medida-card"><div class="val">${u.peso} kg</div><div class="lbl">Peso Inicial</div></div>
        <div class="medida-card"><div class="val">${u.estatura} cm</div><div class="lbl">Estatura</div></div>
        <div class="medida-card"><div class="val">${b}</div><div class="lbl">IMC</div></div>
        <div class="medida-card"><div class="val">${bmiCategory(b)}</div><div class="lbl">Categoría IMC</div></div>
        <div class="medida-card"><div class="val">${DB.rutinas.filter(r=>r.usuarioId===id).length}</div><div class="lbl">Rutinas</div></div>
      </div>
      <div style="margin-bottom:16px">
        <div class="form-section-title" style="padding-top:0">Medidas Corporales Iniciales</div>
        <div class="medidas-grid" style="grid-template-columns:repeat(5,1fr)">
          ${[
            ['Pecho', u.pecho],['Cintura', u.cintura],['Cadera', u.cadera],
            ['Brazo Izq', u.brazoIzq],['Brazo Der', u.brazoDer],
            ['Muslo Izq', u.musloIzq],['Muslo Der', u.musloDer],['Pantorrilla', u.pantorrilla],
          ].map(([lbl,val]) => `<div class="medida-card"><div class="val">${val ? val + ' cm' : '—'}</div><div class="lbl">${lbl}</div></div>`).join('')}
        </div>
      </div>
      ${u.obs ? `<div class="perfil-obs"><strong style="color:var(--accent-blue-light)">📝 Observaciones:</strong><br>${u.obs}</div>` : ''}
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn-primary" onclick="closeModal('modal-perfil');openModalUsuario('${u.id}')">✏️ Editar Perfil</button>
        <button class="btn-secondary" onclick="closeModal('modal-perfil');showSection('rutinas');setTimeout(()=>selectUsuarioRutina('${u.id}'),100)">🏋️ Ver Rutinas</button>
        <button class="btn-secondary" onclick="closeModal('modal-perfil');showSection('progreso');setTimeout(()=>selectUsuarioProgreso('${u.id}'),100)">📊 Ver Progreso</button>
      </div>
    </div>
  `;
  document.getElementById('perfil-content').innerHTML = html;
  openModal('modal-perfil');
}

function renderUsuarios(filter = '') {
  const grid = document.getElementById('usuarios-grid');
  let lista = DB.usuarios;
  if (filter) {
    const f = filter.toLowerCase();
    lista = lista.filter(u => u.nombre.toLowerCase().includes(f) || u.objetivo.toLowerCase().includes(f) || u.nivel.toLowerCase().includes(f));
  }

  if (lista.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <span class="empty-icon">👤</span>
      <h3>${filter ? 'Sin resultados' : 'No hay usuarios registrados'}</h3>
      <p>${filter ? 'Intenta con otro término' : 'Comienza agregando tu primer cliente al sistema'}</p>
      ${!filter ? '<button class="btn-primary" onclick="openModalUsuario()">Agregar Usuario</button>' : ''}
    </div>`;
    return;
  }

  grid.innerHTML = lista.map(u => {
    const avClass = avatarClass(u.nombre);
    const ini = initials(u.nombre);
    const rutinas = DB.rutinas.filter(r => r.usuarioId === u.id).length;
    const b = bmi(u.peso, u.estatura);
    return `
      <div class="user-card">
        <div class="user-card-header">
          <div class="user-avatar-lg ${avClass}">${ini}</div>
          <div style="flex:1">
            <div class="user-card-name">${u.nombre}</div>
            <div class="user-card-meta">${u.edad} años · ${u.genero}</div>
          </div>
          <span class="user-card-badge ${badgeClass(u.nivel)}">${u.nivel}</span>
        </div>
        <div class="user-card-stats">
          <div class="user-stat"><div class="user-stat-val">${u.peso} kg</div><div class="user-stat-lbl">Peso</div></div>
          <div class="user-stat"><div class="user-stat-val">${u.estatura} cm</div><div class="user-stat-lbl">Estatura</div></div>
          <div class="user-stat"><div class="user-stat-val">${b}</div><div class="user-stat-lbl">IMC</div></div>
        </div>
        <div class="user-card-objetivo">
          🎯 ${u.objetivo} &nbsp;·&nbsp; 🏋️ ${rutinas} rutina${rutinas !== 1 ? 's' : ''}
        </div>
        <div class="user-card-actions">
          <button class="btn-action primary" onclick="verPerfil('${u.id}')">Ver Perfil</button>
          <button class="btn-action" onclick="openModalUsuario('${u.id}')">✏️</button>
          <button class="btn-action danger" onclick="eliminarUsuario('${u.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function filtrarUsuarios() {
  const q = document.getElementById('search-usuarios').value;
  renderUsuarios(q);
}

// ===================== DASHBOARD =====================
function renderDashboard() {
  document.getElementById('stat-total-usuarios').textContent = DB.usuarios.length;
  document.getElementById('stat-rutinas').textContent = DB.rutinas.length;
  document.getElementById('stat-progresos').textContent = DB.progresos.length;

  const lista = document.getElementById('dashboard-usuarios-list');
  const ultimos = DB.usuarios.slice(-5).reverse();
  if (ultimos.length === 0) {
    lista.innerHTML = `<div class="empty-state-sm"><p>No hay usuarios registrados aún.</p><button class="btn-link" onclick="showSection('usuarios')">Agregar primer usuario →</button></div>`;
  } else {
    lista.innerHTML = ultimos.map(u => {
      const avClass = avatarClass(u.nombre);
      const ini = initials(u.nombre);
      const rutinas = DB.rutinas.filter(r => r.usuarioId === u.id).length;
      return `<div class="user-mini-item" onclick="verPerfil('${u.id}')">
        <div class="user-avatar ${avClass}">${ini}</div>
        <div class="user-mini-info">
          <div class="name">${u.nombre}</div>
          <div class="meta">${u.objetivo} · ${rutinas} rutina${rutinas !== 1 ? 's' : ''}</div>
        </div>
      </div>`;
    }).join('');
  }
}

// ===================== POPULATE SELECTS =====================
function populateUsuarioSelects() {
  const selRutina = document.getElementById('select-usuario-rutina');
  const selProgreso = document.getElementById('select-usuario-progreso');
  const opts = '<option value="">— Seleccionar Usuario —</option>' +
    DB.usuarios.map(u => `<option value="${u.id}">${u.nombre}</option>`).join('');
  if (selRutina) selRutina.innerHTML = opts;
  if (selProgreso) selProgreso.innerHTML = opts;
}

// ===================== RUTINAS =====================
function openModalRutina(rutinaId = null) {
  const usuarioId = document.getElementById('select-usuario-rutina').value;
  if (!usuarioId) { showToast('Selecciona un usuario primero', 'error'); return; }

  document.getElementById('form-rutina').reset();
  document.getElementById('rutina-id').value = '';
  document.getElementById('ejercicios-container').innerHTML = '';
  document.getElementById('modal-rutina-title').textContent = 'Nueva Rutina Mensual';

  // Set current month/year
  const now = new Date();
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  document.getElementById('r-mes').value = meses[now.getMonth()];
  document.getElementById('r-anio').value = now.getFullYear();

  // Pre-fill with last known weight
  const u = DB.usuarios.find(x => x.id === usuarioId);
  const lastRutina = DB.rutinas.filter(r => r.usuarioId === usuarioId).slice(-1)[0];
  if (lastRutina && lastRutina.pesoFin) {
    document.getElementById('r-peso-ini').value = lastRutina.pesoFin;
  } else if (u) {
    document.getElementById('r-peso-ini').value = u.peso;
  }

  if (rutinaId) {
    const r = DB.rutinas.find(x => x.id === rutinaId);
    if (r) {
      document.getElementById('modal-rutina-title').textContent = 'Editar Rutina';
      document.getElementById('rutina-id').value = r.id;
      document.getElementById('r-mes').value = r.mes;
      document.getElementById('r-anio').value = r.anio;
      document.getElementById('r-tipo').value = r.tipo;
      document.getElementById('r-dias').value = r.dias;
      document.getElementById('r-peso-ini').value = r.pesoIni || '';
      document.getElementById('r-peso-fin').value = r.pesoFin || '';
      document.getElementById('r-notas').value = r.notas || '';
      r.ejercicios.forEach(ej => agregarEjercicio(ej));
    }
  } else {
    // Add a few default exercise rows
    agregarEjercicio();
    agregarEjercicio();
    agregarEjercicio();
  }

  openModal('modal-rutina');
}

function agregarEjercicio(data = null) {
  const container = document.getElementById('ejercicios-container');
  const id = genId();
  const div = document.createElement('div');
  div.className = 'ejercicio-row';
  div.id = `ej-${id}`;
  div.innerHTML = `
    <input type="text" placeholder="Nombre del ejercicio" value="${data?.nombre || ''}" class="ej-nombre" />
    <select class="ej-grupo">
      ${['Pecho','Espalda','Hombros','Bíceps','Tríceps','Pierna','Glúteos','Core','Cardio','Funcional']
        .map(g => `<option ${data?.grupo === g ? 'selected' : ''}>${g}</option>`).join('')}
    </select>
    <input type="text" placeholder="Series x Reps" value="${data?.series || ''}" class="ej-series" />
    <input type="text" placeholder="Peso (kg)" value="${data?.peso || ''}" class="ej-peso" />
    <input type="text" placeholder="Notas / Técnica" value="${data?.notas || ''}" class="ej-enotas" />
    <button type="button" class="btn-remove" onclick="this.closest('.ejercicio-row').remove()" title="Eliminar">✕</button>
  `;
  container.appendChild(div);
}

function guardarRutina(e) {
  e.preventDefault();
  const usuarioId = document.getElementById('select-usuario-rutina').value;
  const id = document.getElementById('rutina-id').value;

  const ejercicios = [];
  document.querySelectorAll('#ejercicios-container .ejercicio-row').forEach(row => {
    const nombre = row.querySelector('.ej-nombre').value.trim();
    if (!nombre) return;
    ejercicios.push({
      nombre,
      grupo: row.querySelector('.ej-grupo').value,
      series: row.querySelector('.ej-series').value.trim(),
      peso: row.querySelector('.ej-peso').value.trim(),
      notas: row.querySelector('.ej-enotas').value.trim(),
    });
  });

  const rutina = {
    id: id || genId(),
    usuarioId,
    mes: document.getElementById('r-mes').value,
    anio: parseInt(document.getElementById('r-anio').value),
    tipo: document.getElementById('r-tipo').value,
    dias: document.getElementById('r-dias').value,
    pesoIni: parseFloat(document.getElementById('r-peso-ini').value) || null,
    pesoFin: parseFloat(document.getElementById('r-peso-fin').value) || null,
    ejercicios,
    notas: document.getElementById('r-notas').value.trim(),
    creado: new Date().toISOString(),
  };

  if (id) {
    const idx = DB.rutinas.findIndex(x => x.id === id);
    if (idx >= 0) DB.rutinas[idx] = rutina;
  } else {
    DB.rutinas.push(rutina);
  }

  saveDB();
  closeModal('modal-rutina');
  cargarRutinaUsuario();
  renderDashboard();
  showToast('✅ Rutina guardada correctamente');
}

function eliminarRutina(id) {
  if (!confirm('¿Eliminar esta rutina?')) return;
  DB.rutinas = DB.rutinas.filter(r => r.id !== id);
  saveDB();
  cargarRutinaUsuario();
  renderDashboard();
  showToast('🗑️ Rutina eliminada', 'error');
}

function cargarRutinaUsuario() {
  const usuarioId = document.getElementById('select-usuario-rutina').value;
  const container = document.getElementById('rutinas-container');
  const btnNueva = document.getElementById('btn-nueva-rutina');

  if (!usuarioId) {
    btnNueva.disabled = true;
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🏋️</span><h3>Selecciona un usuario</h3><p>Elige un usuario para ver o crear sus rutinas mensuales</p></div>`;
    return;
  }

  btnNueva.disabled = false;
  const rutinas = DB.rutinas.filter(r => r.usuarioId === usuarioId)
    .sort((a, b) => b.anio - a.anio || ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].indexOf(b.mes) - ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].indexOf(a.mes));

  if (rutinas.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📋</span><h3>Sin rutinas</h3><p>Este usuario no tiene rutinas asignadas todavía.</p><button class="btn-primary" onclick="openModalRutina()">Crear Primera Rutina</button></div>`;
    return;
  }

  const MESES_ICONS = { Enero:'❄️', Febrero:'💝', Marzo:'🌿', Abril:'🌸', Mayo:'🌻', Junio:'☀️', Julio:'🏖️', Agosto:'🔥', Septiembre:'🍂', Octubre:'🎃', Noviembre:'🍁', Diciembre:'🎄' };

  container.innerHTML = `<div class="rutinas-timeline">` + rutinas.map(r => {
    const diffPeso = r.pesoFin && r.pesoIni ? (r.pesoFin - r.pesoIni).toFixed(1) : null;
    const diffHtml = diffPeso !== null ? `<span class="peso-diff ${parseFloat(diffPeso) < 0 ? 'pos' : 'neg'}">${diffPeso > 0 ? '+' : ''}${diffPeso} kg</span>` : '';

    return `
      <div class="rutina-card">
        <div class="rutina-card-header" onclick="toggleRutinaBody('body-${r.id}')">
          <div class="rutina-mes-badge">
            <div class="mes-icon">${MESES_ICONS[r.mes] || '📅'}</div>
            <div class="rutina-mes-info">
              <h3>${r.mes} ${r.anio}</h3>
              <p>${r.tipo} · ${r.dias} días/semana · ${r.ejercicios.length} ejercicios</p>
            </div>
          </div>
          <div class="rutina-pesos">
            ${r.pesoIni ? `<div class="peso-item"><div class="peso-val">${r.pesoIni} kg</div><div class="peso-lbl">Peso Inicial</div></div>` : ''}
            ${r.pesoIni && r.pesoFin ? `<div class="peso-arrow">→</div>` : ''}
            ${r.pesoFin ? `<div class="peso-item"><div class="peso-val">${r.pesoFin} kg</div><div class="peso-lbl">Peso Final</div></div>` : ''}
            ${diffHtml}
          </div>
          <div class="rutina-header-actions">
            <button class="btn-action" onclick="event.stopPropagation();openModalRutina('${r.id}')">✏️</button>
            <button class="btn-action danger" onclick="event.stopPropagation();eliminarRutina('${r.id}')">🗑️</button>
          </div>
        </div>
        <div class="rutina-card-body" id="body-${r.id}">
          ${r.ejercicios.length > 0 ? `
            <table class="ejercicios-table">
              <thead><tr>
                <th>Ejercicio</th>
                <th>Grupo Muscular</th>
                <th>Series × Reps</th>
                <th>Peso</th>
                <th>Notas</th>
              </tr></thead>
              <tbody>
                ${r.ejercicios.map(ej => `<tr>
                  <td><strong>${ej.nombre}</strong></td>
                  <td><span class="tag-muscular">${ej.grupo}</span></td>
                  <td>${ej.series || '—'}</td>
                  <td>${ej.peso ? ej.peso + ' kg' : '—'}</td>
                  <td style="color:var(--text-muted);font-size:12px">${ej.notas || '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          ` : '<p style="color:var(--text-muted);font-size:13px">Sin ejercicios registrados.</p>'}
          ${r.notas ? `<div class="rutina-notas"><strong>📝 Recomendaciones:</strong><br>${r.notas}</div>` : ''}
        </div>
      </div>
    `;
  }).join('') + '</div>';
}

function toggleRutinaBody(id) {
  const body = document.getElementById(id);
  if (!body) return;
  body.style.display = body.style.display === 'none' ? '' : 'none';
}

function selectUsuarioRutina(id) {
  document.getElementById('select-usuario-rutina').value = id;
  cargarRutinaUsuario();
}

// ===================== PROGRESO =====================
function openModalProgreso() {
  const usuarioId = document.getElementById('select-usuario-progreso').value;
  if (!usuarioId) { showToast('Selecciona un usuario primero', 'error'); return; }

  document.getElementById('form-progreso').reset();
  document.getElementById('p-fecha').value = new Date().toISOString().split('T')[0];

  // Pre-fill last known weight
  const lastProg = DB.progresos.filter(p => p.usuarioId === usuarioId).slice(-1)[0];
  const u = DB.usuarios.find(x => x.id === usuarioId);
  if (lastProg) {
    document.getElementById('p-peso').value = lastProg.peso;
    document.getElementById('p-pecho').value = lastProg.pecho || '';
    document.getElementById('p-cintura').value = lastProg.cintura || '';
    document.getElementById('p-cadera').value = lastProg.cadera || '';
    document.getElementById('p-brazo-izq').value = lastProg.brazoIzq || '';
    document.getElementById('p-brazo-der').value = lastProg.brazoDer || '';
    document.getElementById('p-muslo-izq').value = lastProg.musloIzq || '';
    document.getElementById('p-muslo-der').value = lastProg.musloDer || '';
    document.getElementById('p-pantorrilla').value = lastProg.pantorrilla || '';
  } else if (u) {
    document.getElementById('p-peso').value = u.peso;
    document.getElementById('p-pecho').value = u.pecho || '';
    document.getElementById('p-cintura').value = u.cintura || '';
    document.getElementById('p-cadera').value = u.cadera || '';
  }

  openModal('modal-progreso');
}

function guardarProgreso(e) {
  e.preventDefault();
  const usuarioId = document.getElementById('select-usuario-progreso').value;
  const prog = {
    id: genId(),
    usuarioId,
    fecha: document.getElementById('p-fecha').value,
    peso: parseFloat(document.getElementById('p-peso').value),
    pecho: parseFloat(document.getElementById('p-pecho').value) || null,
    cintura: parseFloat(document.getElementById('p-cintura').value) || null,
    cadera: parseFloat(document.getElementById('p-cadera').value) || null,
    brazoIzq: parseFloat(document.getElementById('p-brazo-izq').value) || null,
    brazoDer: parseFloat(document.getElementById('p-brazo-der').value) || null,
    musloIzq: parseFloat(document.getElementById('p-muslo-izq').value) || null,
    musloDer: parseFloat(document.getElementById('p-muslo-der').value) || null,
    pantorrilla: parseFloat(document.getElementById('p-pantorrilla').value) || null,
    notas: document.getElementById('p-notas').value.trim(),
  };

  DB.progresos.push(prog);
  saveDB();
  closeModal('modal-progreso');
  cargarProgresoUsuario();
  renderDashboard();
  showToast('✅ Progreso registrado correctamente');
}

function cargarProgresoUsuario() {
  const usuarioId = document.getElementById('select-usuario-progreso').value;
  const container = document.getElementById('progreso-container');
  const btnNuevo = document.getElementById('btn-nuevo-progreso');

  if (!usuarioId) {
    btnNuevo.disabled = true;
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📊</span><h3>Selecciona un usuario</h3><p>Elige un usuario para ver su historial de progreso</p></div>`;
    return;
  }

  btnNuevo.disabled = false;
  const u = DB.usuarios.find(x => x.id === usuarioId);
  const progresos = DB.progresos.filter(p => p.usuarioId === usuarioId)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const pesoActual = progresos[0]?.peso || u?.peso || 0;
  const pesoInicial = u?.peso || 0;
  const diff = pesoInicial ? (pesoActual - pesoInicial).toFixed(1) : 0;

  let headerHtml = `<div class="progreso-header-info">
    <div class="pi-item"><div class="pi-val">${u?.nombre?.split(' ')[0] || '—'}</div><div class="pi-lbl">Usuario</div></div>
    <div class="pi-item"><div class="pi-val" style="color:var(--accent-blue)">${pesoInicial} kg</div><div class="pi-lbl">Peso Inicial</div></div>
    <div class="pi-item"><div class="pi-val" style="color:var(--accent-cyan)">${pesoActual} kg</div><div class="pi-lbl">Peso Actual</div></div>
    <div class="pi-item"><div class="pi-val" style="color:${parseFloat(diff) < 0 ? 'var(--accent-green)' : 'var(--accent-orange)'}">${diff > 0 ? '+' : ''}${diff} kg</div><div class="pi-lbl">Variación</div></div>
    <div class="pi-item"><div class="pi-val">${progresos.length}</div><div class="pi-lbl">Registros</div></div>
  </div>`;

  if (progresos.length === 0) {
    container.innerHTML = headerHtml + `<div class="empty-state"><span class="empty-icon">📈</span><h3>Sin registros</h3><p>No hay mediciones registradas aún.</p></div>`;
    return;
  }

  // Simple chart SVG
  const chartHtml = buildWeightChart(progresos);

  const registrosHtml = progresos.map((p, i) => {
    const prev = progresos[i + 1];
    const pesoDiff = prev ? (p.peso - prev.peso).toFixed(1) : null;
    return `
      <div class="progreso-item">
        <div class="progreso-item-header">
          <div class="progreso-fecha">📅 ${formatDate(p.fecha)}</div>
          <div style="display:flex;align-items:center;gap:8px">
            ${pesoDiff !== null ? `<span class="peso-diff ${parseFloat(pesoDiff) < 0 ? 'pos' : 'neg'}">${parseFloat(pesoDiff) > 0 ? '+' : ''}${pesoDiff} kg</span>` : ''}
            <div class="progreso-peso">${p.peso} kg</div>
          </div>
        </div>
        <div class="medidas-mini">
          ${[['Pecho', p.pecho],['Cintura', p.cintura],['Cadera', p.cadera],['Brazo Izq', p.brazoIzq],
             ['Brazo Der', p.brazoDer],['Muslo Izq', p.musloIzq],['Muslo Der', p.musloDer],['Pantorrilla', p.pantorrilla]]
            .filter(([,v]) => v)
            .map(([l,v]) => `<div class="medida-chip"><div class="val">${v} cm</div><div class="lbl">${l}</div></div>`).join('')}
        </div>
        ${p.notas ? `<div style="margin-top:10px;font-size:12px;color:var(--text-muted);font-style:italic">💬 ${p.notas}</div>` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    ${headerHtml}
    <div class="progreso-grid">
      <div class="card" style="grid-column:1/-1">
        <div class="card-header"><h2>📈 Evolución del Peso</h2></div>
        ${chartHtml}
      </div>
    </div>
    <div style="margin-top:20px">
      <h3 style="font-size:14px;font-weight:700;color:var(--text-secondary);margin-bottom:12px">Historial de Mediciones</h3>
      <div class="progreso-registros">${registrosHtml}</div>
    </div>
  `;
}

function buildWeightChart(progresos) {
  const data = progresos.slice().reverse();
  if (data.length < 2) return '<p style="color:var(--text-muted);font-size:13px;padding:10px">Necesitas al menos 2 registros para ver la gráfica.</p>';

  const weights = data.map(p => p.peso);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const W = 600, H = 200, pad = 40;
  const scaleX = i => pad + (i / (data.length - 1)) * (W - pad * 2);
  const scaleY = v => H - pad - ((v - minW) / (maxW - minW)) * (H - pad * 2);

  const points = data.map((p, i) => `${scaleX(i)},${scaleY(p.peso)}`).join(' ');
  const areaPoints = `${scaleX(0)},${H - pad} ` + points + ` ${scaleX(data.length-1)},${H - pad}`;

  const labels = data.map((p, i) => {
    const d = new Date(p.fecha + 'T00:00:00');
    const lbl = `${d.getDate()}/${d.getMonth()+1}`;
    return `<text x="${scaleX(i)}" y="${H - 8}" text-anchor="middle" fill="#5A5A80" font-size="10">${lbl}</text>`;
  }).join('');

  const dots = data.map((p, i) => `
    <circle cx="${scaleX(i)}" cy="${scaleY(p.peso)}" r="5" fill="url(#chartGrad)" stroke="var(--bg-card)" stroke-width="2"/>
    <text x="${scaleX(i)}" y="${scaleY(p.peso) - 10}" text-anchor="middle" fill="#F0F0FF" font-size="10" font-weight="600">${p.peso}</text>
  `).join('');

  const gridLines = [0.25, 0.5, 0.75].map(f => {
    const y = pad + f * (H - pad * 2);
    const val = (maxW - (f * (maxW - minW))).toFixed(1);
    return `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="#2a2a40" stroke-dasharray="4,4"/>
            <text x="${pad - 6}" y="${y + 4}" text-anchor="end" fill="#5A5A80" font-size="9">${val}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#6C63FF"/>
        <stop offset="100%" stop-color="#00D4FF"/>
      </linearGradient>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6C63FF" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#6C63FF" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${gridLines}
    <polygon points="${areaPoints}" fill="url(#areaGrad)"/>
    <polyline points="${points}" fill="none" stroke="url(#chartGrad)" stroke-width="3" stroke-linejoin="round"/>
    ${labels}
    ${dots}
  </svg>`;
}

function selectUsuarioProgreso(id) {
  document.getElementById('select-usuario-progreso').value = id;
  cargarProgresoUsuario();
}

// ===================== RECETAS =====================
const RECETAS = [
  { id: 1, nombre: 'Bowl de Arroz con Pollo', categoria: 'proteina', emoji: '🍗', desc: 'Arroz integral, pechuga de pollo a la plancha, brócoli y aguacate. Perfecto post-entreno.', proteina: '45g', carbs: '55g', grasas: '12g', kcal: '510', tag: 'Alta Proteína' },
  { id: 2, nombre: 'Batido de Proteína Banana', categoria: 'proteina', emoji: '🍌', desc: 'Banana, proteína en polvo, leche de almendras y mantequilla de maní. Rápido y delicioso.', proteina: '30g', carbs: '40g', grasas: '8g', kcal: '350', tag: 'Alta Proteína' },
  { id: 3, nombre: 'Avena Pre-Entreno', categoria: 'carbohidratos', emoji: '🥣', desc: 'Avena con frutas, miel y nueces. La energía perfecta para tu sesión de entrenamiento.', proteina: '12g', carbs: '65g', grasas: '10g', kcal: '400', tag: 'Pre-Entreno' },
  { id: 4, nombre: 'Tostadas con Huevo y Aguacate', categoria: 'carbohidratos', emoji: '🍳', desc: 'Pan integral, huevos revueltos y aguacate. Comida balanceada ideal antes de entrenar.', proteina: '20g', carbs: '35g', grasas: '18g', kcal: '380', tag: 'Pre-Entreno' },
  { id: 5, nombre: 'Salmón con Vegetales al Vapor', categoria: 'recuperacion', emoji: '🐟', desc: 'Filete de salmón con espinacas, zanahorias y camote. Rico en Omega-3 para recuperación muscular.', proteina: '38g', carbs: '30g', grasas: '20g', kcal: '460', tag: 'Recuperación' },
  { id: 6, nombre: 'Batido Verde Recuperador', categoria: 'recuperacion', emoji: '💚', desc: 'Espinaca, piña, jengibre, proteína y leche de coco. Anti-inflamatorio y rico en nutrientes.', proteina: '25g', carbs: '35g', grasas: '7g', kcal: '300', tag: 'Recuperación' },
  { id: 7, nombre: 'Huevos Duros con Almendras', categoria: 'snack', emoji: '🥚', desc: 'Snack perfecto entre comidas. 2 huevos duros y un puñado de almendras tostadas.', proteina: '18g', carbs: '6g', grasas: '20g', kcal: '270', tag: 'Snack' },
  { id: 8, nombre: 'Yogur Griego con Berries', categoria: 'snack', emoji: '🫐', desc: 'Yogur griego natural con arándanos, fresas y granola artesanal. Alto en probióticos.', proteina: '18g', carbs: '28g', grasas: '4g', kcal: '220', tag: 'Snack' },
  { id: 9, nombre: 'Ensalada de Atún y Garbanzos', categoria: 'proteina', emoji: '🥗', desc: 'Atún en agua, garbanzos, tomate, pepino, limón y aceite de oliva. Fácil y nutritivo.', proteina: '35g', carbs: '32g', grasas: '8g', kcal: '340', tag: 'Alta Proteína' },
  { id: 10, nombre: 'Pasta Integral con Pavo', categoria: 'carbohidratos', emoji: '🍝', desc: 'Pasta de trigo integral con carne molida de pavo, salsa de tomate casera y especias.', proteina: '32g', carbs: '60g', grasas: '10g', kcal: '460', tag: 'Pre-Entreno' },
  { id: 11, nombre: 'Caldo de Res con Verduras', categoria: 'recuperacion', emoji: '🍲', desc: 'Caldo rico en colágeno con zanahoria, apio, y res magra. Ideal para articulaciones y músculos.', proteina: '28g', carbs: '18g', grasas: '9g', kcal: '270', tag: 'Recuperación' },
  { id: 12, nombre: 'Manzana con Mantequilla de Maní', categoria: 'snack', emoji: '🍎', desc: 'Manzana mediana con 2 cucharadas de mantequilla de maní natural. Snack de energía sostenida.', proteina: '8g', carbs: '30g', grasas: '14g', kcal: '270', tag: 'Snack' },
];

function renderRecetas(cat) {
  const grid = document.getElementById('recetas-grid');
  const lista = cat === 'todas' ? RECETAS : RECETAS.filter(r => r.categoria === cat);

  grid.innerHTML = lista.map(r => `
    <div class="receta-card">
      <div class="receta-img" style="background:${getCatGradient(r.categoria)}">
        <span style="position:relative;z-index:1;font-size:64px">${r.emoji}</span>
        <span class="receta-category-tag">${r.tag}</span>
      </div>
      <div class="receta-body">
        <div class="receta-name">${r.nombre}</div>
        <div class="receta-desc">${r.desc}</div>
        <div class="receta-macros">
          <div class="macro-chip macro-p"><div class="m-val">${r.proteina}</div><div class="m-lbl">Proteína</div></div>
          <div class="macro-chip macro-c"><div class="m-val">${r.carbs}</div><div class="m-lbl">Carbos</div></div>
          <div class="macro-chip macro-g"><div class="m-val">${r.grasas}</div><div class="m-lbl">Grasas</div></div>
          <div class="macro-chip macro-k"><div class="m-val">${r.kcal}</div><div class="m-lbl">kcal</div></div>
        </div>
      </div>
    </div>
  `).join('');
}

function getCatGradient(cat) {
  return {
    proteina: 'linear-gradient(135deg, #6C63FF, #9B59F5)',
    carbohidratos: 'linear-gradient(135deg, #FF7043, #FFD700)',
    recuperacion: 'linear-gradient(135deg, #00E5A0, #00A8FF)',
    snack: 'linear-gradient(135deg, #FF4E8A, #FF7043)',
  }[cat] || 'linear-gradient(135deg, #6C63FF, #00D4FF)';
}

function filtrarRecetas(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRecetas(cat);
}

// ===================== INIT =====================
loadDB();
renderDashboard();
renderRecetas('todas');
populateUsuarioSelects();
