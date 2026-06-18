/* ============================================================
   ROMEO PERSONAL TRAINER — Shared JS v2.0
   ============================================================ */

// ===================== DATABASE =====================
let DB = {
  usuarios:  [],
  rutinas:   [],
  progresos: [],
  sesiones:  [],   // { id, usuarioId, rutinaId, fecha, hora, estado:'pendiente'|'completada'|'cancelada' }
};

function loadDB() {
  try { const s = localStorage.getItem('romeo_db'); if (s) DB = JSON.parse(s); }
  catch(e) {}
  // Migrate old key
  try {
    if (!DB.usuarios.length) {
      const old = localStorage.getItem('gymproDB');
      if (old) { const o = JSON.parse(old); DB.usuarios = o.usuarios||[]; DB.rutinas = o.rutinas||[]; DB.progresos = o.progresos||[]; }
    }
  } catch(e) {}
  if (!DB.sesiones) DB.sesiones = [];
}

function saveDB() { localStorage.setItem('romeo_db', JSON.stringify(DB)); }

// ===================== UTILITIES =====================
let _id = Date.now();
function genId() { return (++_id).toString(36); }

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3200);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
}

function avatarClass(name) {
  const c = ['av-0','av-1','av-2','av-3','av-4','av-5'];
  let code = 0; for (let ch of name) code += ch.charCodeAt(0);
  return c[code % c.length];
}

function initials(name) { return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

function badgeClass(nivel) {
  return { Principiante:'badge-green', Intermedio:'badge-blue', Avanzado:'badge-pink' }[nivel] || 'badge-green';
}

function bmi(peso, est) {
  if (!peso || !est) return '—';
  return (peso / ((est/100)**2)).toFixed(1);
}

function bmiCategory(b) {
  const v = parseFloat(b);
  if (isNaN(v)) return '';
  if (v < 18.5) return 'Bajo peso';
  if (v < 25)   return 'Normal';
  if (v < 30)   return 'Sobrepeso';
  return 'Obesidad';
}

// ===================== COMPUTED STATS =====================
function calcRevenue() {
  return DB.usuarios.reduce((sum, u) => sum + (parseFloat(u.tarifa) || 0), 0);
}

function calcCompletitudPromedio() {
  if (!DB.usuarios.length) return 0;
  const total = DB.usuarios.reduce((sum, u) => sum + calcCompletitudUsuario(u.id), 0);
  return Math.round(total / DB.usuarios.length);
}

function calcCompletitudUsuario(uid) {
  const sesiones = DB.sesiones.filter(s => s.usuarioId === uid);
  if (!sesiones.length) return 0;
  const completadas = sesiones.filter(s => s.estado === 'completada').length;
  return Math.round((completadas / sesiones.length) * 100);
}

function sesionesHoy() {
  const hoy = new Date().toISOString().split('T')[0];
  return DB.sesiones.filter(s => s.fecha === hoy).sort((a,b) => a.hora.localeCompare(b.hora));
}

function volumenSemanal() {
  // Returns last 4 weeks of total routine volume (sets × reps × weight)
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const label = `Sem ${4-i}`;
    // Simulate volume from rutinas data
    const vol = DB.rutinas.reduce((sum, r) => {
      return sum + r.ejercicios.reduce((s2, ej) => {
        const sets = parseInt(ej.series?.split('×')[0]) || parseInt(ej.series?.split('x')[0]) || 3;
        const reps = parseInt(ej.series?.split('×')[1]) || parseInt(ej.series?.split('x')[1]) || 10;
        const peso = parseFloat(ej.peso) || 0;
        return s2 + sets * reps * peso;
      }, 0);
    }, 0);
    weeks.push({ label, vol: Math.round(vol * (0.7 + Math.random() * 0.3)) });
  }
  return weeks;
}

// ===================== SIDEBAR =====================
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const sb = document.getElementById('sidebar');
  const btn = document.querySelector('.menu-toggle');
  if (sb && window.innerWidth <= 768 && !sb.contains(e.target) && btn && !btn.contains(e.target)) {
    sb.classList.remove('open');
  }
});

function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('active'); document.body.style.overflow = ''; }
}

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

function buildSidebar(activePage) {
  const pages = [
    { id:'dashboard',     href:'index.html',          label:'Dashboard',    icon:`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>` },
    { id:'usuarios',      href:'usuarios.html',        label:'Clientes',     icon:`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` },
    { id:'rutinas',       href:'rutinas.html',         label:'Rutinas',      icon:`<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
    { id:'entrenamiento', href:'entrenamiento.html',   label:'Entrenamiento',icon:`<polyline points="13 2 13 9 20 9"/><path d="M20 9L13 2"/><path d="M4 4h7"/><path d="M4 8h5"/><path d="M4 12h9"/><path d="M4 16h16"/><path d="M4 20h16"/>` },
    { id:'progreso',      href:'progreso.html',        label:'Progreso',     icon:`<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>` },
    { id:'recetas',       href:'recetas.html',         label:'Nutrición',    icon:`<path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-10V2z" opacity=".5"/>` },
  ];

  const badges = {
    dashboard: '',
    usuarios: DB.usuarios.length > 0 ? `<span style="margin-left:auto;background:rgba(255,60,172,0.15);color:#FF3CAC;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">${DB.usuarios.length}</span>` : '',
    entrenamiento: sesionesHoy().length > 0 ? `<span style="margin-left:auto;background:rgba(0,229,160,0.15);color:#00E5A0;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">${sesionesHoy().length}</span>` : '',
  };

  return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <img src="1.jpeg" alt="Romeo Personal Trainer" class="sidebar-logo-img" />
    </div>
    <nav class="sidebar-nav">
      ${pages.map(p => `
        <a href="${p.href}" class="nav-item ${activePage === p.id ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${p.icon}</svg>
          <span>${p.label}</span>
          ${badges[p.id] || ''}
        </a>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="avatar-sm">R</div>
        <div>
          <div class="sidebar-username">Romeo</div>
          <div class="sidebar-role">Personal Trainer</div>
        </div>
      </div>
    </div>
  </aside>`;
}

function buildTopbar(title, actionsHtml = '') {
  return `
  <header class="topbar">
    <button class="menu-toggle" onclick="toggleSidebar()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div class="topbar-title">${title}</div>
    <div class="topbar-actions">${actionsHtml}</div>
  </header>`;
}

function buildToast() { return `<div class="toast" id="toast"></div>`; }

// ===================== RECETAS DATA =====================
const RECETAS = [
  { id:1,  nombre:'Bowl de Arroz con Pollo',         categoria:'proteina',      emoji:'🍗', desc:'Arroz integral, pechuga de pollo, brócoli y aguacate. Perfecto post-entreno.',       proteina:'45g', carbs:'55g', grasas:'12g', kcal:'510', tag:'Alta Proteína' },
  { id:2,  nombre:'Batido de Proteína Banana',       categoria:'proteina',      emoji:'🍌', desc:'Banana, proteína en polvo, leche de almendras y mantequilla de maní.',               proteina:'30g', carbs:'40g', grasas:'8g',  kcal:'350', tag:'Alta Proteína' },
  { id:3,  nombre:'Avena Pre-Entreno',               categoria:'carbohidratos', emoji:'🥣', desc:'Avena con frutas, miel y nueces. Energía perfecta para tu sesión.',                  proteina:'12g', carbs:'65g', grasas:'10g', kcal:'400', tag:'Pre-Entreno' },
  { id:4,  nombre:'Tostadas con Huevo y Aguacate',  categoria:'carbohidratos', emoji:'🍳', desc:'Pan integral, huevos revueltos y aguacate. Ideal antes de entrenar.',                 proteina:'20g', carbs:'35g', grasas:'18g', kcal:'380', tag:'Pre-Entreno' },
  { id:5,  nombre:'Salmón con Vegetales al Vapor',  categoria:'recuperacion',  emoji:'🐟', desc:'Filete de salmón con espinacas y camote. Rico en Omega-3 para recuperación.',        proteina:'38g', carbs:'30g', grasas:'20g', kcal:'460', tag:'Recuperación' },
  { id:6,  nombre:'Batido Verde Recuperador',       categoria:'recuperacion',  emoji:'💚', desc:'Espinaca, piña, jengibre, proteína y leche de coco. Anti-inflamatorio.',             proteina:'25g', carbs:'35g', grasas:'7g',  kcal:'300', tag:'Recuperación' },
  { id:7,  nombre:'Huevos Duros con Almendras',     categoria:'snack',         emoji:'🥚', desc:'Snack perfecto entre comidas. 2 huevos duros y almendras tostadas sin sal.',         proteina:'18g', carbs:'6g',  grasas:'20g', kcal:'270', tag:'Snack' },
  { id:8,  nombre:'Yogur Griego con Berries',       categoria:'snack',         emoji:'🫐', desc:'Yogur griego natural con arándanos, fresas y granola artesanal.',                    proteina:'18g', carbs:'28g', grasas:'4g',  kcal:'220', tag:'Snack' },
  { id:9,  nombre:'Ensalada de Atún y Garbanzos',  categoria:'proteina',      emoji:'🥗', desc:'Atún, garbanzos, tomate, pepino, limón y aceite de oliva extra virgen.',             proteina:'35g', carbs:'32g', grasas:'8g',  kcal:'340', tag:'Alta Proteína' },
  { id:10, nombre:'Pasta Integral con Pavo',        categoria:'carbohidratos', emoji:'🍝', desc:'Pasta integral con carne molida de pavo y salsa de tomate casera.',                  proteina:'32g', carbs:'60g', grasas:'10g', kcal:'460', tag:'Pre-Entreno' },
  { id:11, nombre:'Caldo de Res con Verduras',      categoria:'recuperacion',  emoji:'🍲', desc:'Caldo rico en colágeno. Ideal para articulaciones y músculos tras el entreno.',      proteina:'28g', carbs:'18g', grasas:'9g',  kcal:'270', tag:'Recuperación' },
  { id:12, nombre:'Manzana con Mantequilla de Maní',categoria:'snack',         emoji:'🍎', desc:'Manzana con mantequilla de maní natural. Energía sostenida entre comidas.',          proteina:'8g',  carbs:'30g', grasas:'14g', kcal:'270', tag:'Snack' },
];

function getCatGradient(cat) {
  return { proteina:'linear-gradient(135deg,#FF3CAC,#784BA0)', carbohidratos:'linear-gradient(135deg,#FF7043,#FFD600)', recuperacion:'linear-gradient(135deg,#00E5A0,#00A8FF)', snack:'linear-gradient(135deg,#FF4E8A,#FF7043)' }[cat] || 'linear-gradient(135deg,#FF3CAC,#2B86C5)';
}

// ===================== MOTIVATIONAL QUOTES =====================
const QUOTES = [
  { text: "El único mal entrenamiento es el que no hiciste.", author: "Desconocido" },
  { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali" },
  { text: "Tu cuerpo puede hacerlo. Es tu mente la que tienes que convencer.", author: "Desconocido" },
  { text: "El dolor que sientes hoy es la fuerza que sentirás mañana.", author: "Arnold Schwarzenegger" },
  { text: "La disciplina es el puente entre metas y logros.", author: "Jim Rohn" },
  { text: "Cada rep te hace más fuerte. Cada sesión te cambia.", author: "Romeo PT" },
  { text: "El éxito empieza antes de entrar al gimnasio.", author: "Desconocido" },
  { text: "Entrena duro, come limpio, descansa bien. Repite.", author: "Romeo PT" },
];

function getQuoteOfDay() {
  const d = new Date().getDate();
  return QUOTES[d % QUOTES.length];
}

// Init
loadDB();
