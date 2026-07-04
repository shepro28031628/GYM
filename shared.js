/* ============================================================
   ROMEO PERSONAL TRAINER — Shared JS v2.0
   ============================================================ */

// ===================== DATABASE =====================
let DB = {
  usuarios:  [],
  rutinas:   [],
  progresos: [],
  sesiones:  [],
};

// ── Claves que se persisten en archivo ──
const DB_KEYS = [
  'romeo_db', 'gym_active_user', 'romeo_current_active_user_id',
  'romeo_recetas_custom', 'romeo_cats_custom',
  'romeo_custom_exercises', 'romeo_custom_groups'
];

function loadDB() {
  // Carga sincrónica desde localStorage (copia espejo)
  // La carga definitiva desde archivo se hace en initPersist()
  try { const s = localStorage.getItem('romeo_db'); if (s) DB = JSON.parse(s); }
  catch(e) {}
  try {
    if (!DB.usuarios.length) {
      const old = localStorage.getItem('gymproDB');
      if (old) { const o = JSON.parse(old); DB.usuarios = o.usuarios||[]; DB.rutinas = o.rutinas||[]; DB.progresos = o.progresos||[]; }
    }
  } catch(e) {}
  if (!DB.sesiones) DB.sesiones = [];
}

async function saveDB() {
  await PersistDB.set('romeo_db', DB);
}

function getDB() { return DB; }

function getActiveUser() {
  try {
    const s = localStorage.getItem('gym_active_user');
    if (s) { const u = JSON.parse(s); const dbUser = DB.usuarios.find(x => x.id === u.id); if (dbUser) return dbUser; }
  } catch(e) {}
  try {
    const uid = localStorage.getItem('romeo_current_active_user_id');
    if (uid) { const dbUser = DB.usuarios.find(x => x.id === uid); if (dbUser) return dbUser; }
  } catch(e) {}
  return DB.usuarios[0] || null;
}

async function setActiveUser(u) {
  localStorage.setItem('gym_active_user', JSON.stringify(u));
  await PersistDB.set('gym_active_user', u);
}

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
  if (sb && window.innerWidth <= 1024 && !sb.contains(e.target) && btn && !btn.contains(e.target)) {
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
    { id:'macros',        href:'macros.html',          label:'Macros',       icon:`<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10H12z"/>` },
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
  const activeUser = getActiveUser();
  const optionsHtml = DB.usuarios.map(u => `
    <option value="${u.id}" ${activeUser && activeUser.id === u.id ? 'selected' : ''}>
      ${u.nombre}
    </option>
  `).join('');

  const clientSelector = DB.usuarios.length > 0 ? `
    <div class="topbar-client-selector">
      <label for="global-client-select">👤 Cliente:</label>
      <select id="global-client-select" onchange="handleGlobalClientChange(this.value)">
        ${optionsHtml}
      </select>
    </div>
  ` : '';

  return `
  <header class="topbar">
    <button class="menu-toggle" onclick="toggleSidebar()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div class="topbar-title">${title}</div>
    <div style="display:flex; align-items:center; gap:12px; margin-left:auto;">
      ${clientSelector}
      <div class="topbar-actions">${actionsHtml}</div>
    </div>
  </header>`;
}

function handleGlobalClientChange(uid) {
  const u = DB.usuarios.find(x => x.id === uid);
  if (u) {
    localStorage.setItem('gym_active_user', JSON.stringify(u));
    // Sincronizar selectores locales en páginas
    const localSel = document.getElementById('sel-usuario');
    if (localSel) {
      localSel.value = uid;
      if (typeof onUsuarioChange === 'function') {
        onUsuarioChange();
      }
    }
    // Disparar eventos
    window.dispatchEvent(new Event('gym_active_user_changed'));
    window.dispatchEvent(new Event('gym_diario_actualizado'));
    showToast(`Cliente activo: ${u.nombre}`, 'info');
    // Si no estamos en una página con selector local, recargar para actualizar widgets
    if (!localSel) {
      setTimeout(() => window.location.reload(), 400);
    }
  }
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
  { id:13, nombre:'Batido Proteico de Chocolate y Maní', categoria:'batidos',      emoji:'🥤', desc:'Proteína de chocolate, mantequilla de maní, banana y chía. Ideal para ganar masa.', proteina:'35g', carbs:'45g', grasas:'15g', kcal:'450', tag:'Batidos' },
  { id:14, nombre:'Batido Verde Antioxidante',         categoria:'batidos',      emoji:'🥬', desc:'Espinaca, manzana verde, piña, jengibre y agua de coco. Depurativo y vitamínico.',  proteina:'3g',  carbs:'35g', grasas:'1g',  kcal:'160', tag:'Batidos' },
  { id:15, nombre:'Batido Energético de Avena y Fresa', categoria:'batidos',      emoji:'🍓', desc:'Avena en hojuelas, fresas frescas, leche descremada y un toque de miel natural.',    proteina:'10g', carbs:'52g', grasas:'4g',  kcal:'280', tag:'Batidos' },
  { id:16, nombre:'Batido de Arándanos y Yogur Griego', categoria:'batidos',      emoji:'🫐', desc:'Arándanos antioxidantes, yogur griego descremado y linaza para digestión óptima.', proteina:'18g', carbs:'26g', grasas:'5g',  kcal:'220', tag:'Batidos' },
  { id:17, nombre:'Batido Keto de Aguacate y Coco',    categoria:'batidos',      emoji:'🥑', desc:'Aguacate, leche de coco, espinaca y stevia. Alto en grasas saludables y bajo en carbos.', proteina:'8g',  carbs:'12g', grasas:'28g', kcal:'330', tag:'Batidos' },
  { id:18, nombre:'Batido Saciante de Manzana y Canela', categoria:'batidos',      emoji:'🍎', desc:'Manzana, avena, yogur griego, canela y nuez moscada. Controla la ansiedad.',        proteina:'6g',  carbs:'38g', grasas:'5g',  kcal:'210', tag:'Batidos' },
  { id:19, nombre:'Batido Tropical de Piña y Mango',   categoria:'batidos',      emoji:'🍍', desc:'Piña, mango, jugo de naranja y yogur natural. Aporte de vitamina C y energía.',     proteina:'4g',  carbs:'48g', grasas:'1g',  kcal:'200', tag:'Batidos' },
  { id:20, nombre:'Batido Quemagrasas de Toronja',     categoria:'batidos',      emoji:'🍊', desc:'Toronja, jengibre, apio y piña. Acelera el metabolismo y la quema calórica.',       proteina:'2g',  carbs:'28g', grasas:'0g',  kcal:'120', tag:'Batidos' },
  { id:21, nombre:'Batido de Proteína Moca y Café',    categoria:'batidos',      emoji:'☕', desc:'Café expreso, scoop de proteína de chocolate y leche de almendras. Activador pre-entreno.', proteina:'28g', carbs:'30g', grasas:'6g',  kcal:'280', tag:'Batidos' },
  { id:22, nombre:'Batido Recuperador de Sandía',      categoria:'batidos',      emoji:'🍉', desc:'Sandía, menta y agua de coco. Ideal para hidratación extrema post-entrenamiento.',  proteina:'3g',  carbs:'24g', grasas:'1g',  kcal:'110', tag:'Batidos' },
  { id:23, nombre:'Batido de Avena, Almendras y Miel', categoria:'batidos',      emoji:'🌾', desc:'Avena, mantequilla de almendras, leche descremada y miel. Excelente snack saciante.', proteina:'9g',  carbs:'48g', grasas:'12g', kcal:'320', tag:'Batidos' },
  { id:24, nombre:'Batido de Espinacas y Kiwi',        categoria:'batidos',      emoji:'🥝', desc:'Espinacas, kiwi, manzana verde y semillas de chía. Altamente depurativo.',          proteina:'4g',  carbs:'32g', grasas:'1g',  kcal:'150', tag:'Batidos' },
  { id:25, nombre:'Batido Proteico de Vainilla y Nueces', categoria:'batidos',     emoji:'🥜', desc:'Proteína de vainilla, nueces picadas, plátano y leche descremada. Fuerza muscular.', proteina:'30g', carbs:'34g', grasas:'14g', kcal:'380', tag:'Batidos' },
  { id:26, nombre:'Batido de Dátiles y Avena',         categoria:'batidos',      emoji:'🌴', desc:'Dátiles, avena en hojuelas, leche de almendras y canela. Dulzor natural energético.', proteina:'6g',  carbs:'58g', grasas:'4g',  kcal:'290', tag:'Batidos' },
  { id:27, nombre:'Batido Detox de Apio y Pepino',     categoria:'batidos',      emoji:'🥒', desc:'Apio, pepino, limón, manzana y agua. Bajo en calorías y muy diurético.',             proteina:'2g',  carbs:'18g', grasas:'0g',  kcal:'80',  tag:'Batidos' },
  { id:28, nombre:'Batido de Papaya y Linaza',         categoria:'batidos',      emoji:'🥭', desc:'Papaya, semillas de linaza y yogur natural. Excelente para la salud digestiva.',    proteina:'5g',  carbs:'36g', grasas:'6g',  kcal:'210', tag:'Batidos' },
  { id:29, nombre:'Batido de Zanahoria y Naranja',     categoria:'batidos',      emoji:'🥕', desc:'Zanahoria, naranja, jengibre y agua de coco. Fortalece el sistema inmune.',          proteina:'3g',  carbs:'34g', grasas:'1g',  kcal:'150', tag:'Batidos' },
  { id:30, nombre:'Batido de Melón y Limón',           categoria:'batidos',      emoji:'🍈', desc:'Melón dulce, zumo de limón y agua de coco. Altamente hidratante y refrescante.',     proteina:'2g',  carbs:'22g', grasas:'0g',  kcal:'90',  tag:'Batidos' },
  { id:31, nombre:'Batido Proteico de Fresa y Requesón', categoria:'batidos',     emoji:'🍧', desc:'Fresas, requesón bajo en grasa, leche y stevia. Cremosidad alta en proteína.',       proteina:'26g', carbs:'28g', grasas:'5g',  kcal:'260', tag:'Batidos' },
  { id:32, nombre:'Batido Superverde de Espirulina',   categoria:'batidos',      emoji:'🧪', desc:'Espirulina, espinaca, plátano y leche vegetal. Superalimento energizante.',          proteina:'8g',  carbs:'22g', grasas:'2g',  kcal:'130', tag:'Batidos' },
  { id:33, nombre:'Batido de Coco y Almendras',        categoria:'batidos',      emoji:'🥥', desc:'Leche de coco, almendras enteras, proteína de vainilla y hielo. Delicia cremosa.',   proteina:'7g',  carbs:'24g', grasas:'16g', kcal:'270', tag:'Batidos' },
  { id:34, nombre:'Batido de Melocotón y Yogur',       categoria:'batidos',      emoji:'🍑', desc:'Melocotón en rodajas, yogur griego natural, leche y un toque de vainilla.',         proteina:'12g', carbs:'38g', grasas:'3g',  kcal:'220', tag:'Batidos' },
  { id:35, nombre:'Batido de Té Verde y Limón',        categoria:'batidos',      emoji:'🍵', desc:'Té verde frío, zumo de limón, menta y una cdta de miel. Antioxidante quemagrasa.',   proteina:'2g',  carbs:'16g', grasas:'0g',  kcal:'70',  tag:'Batidos' },
  { id:36, nombre:'Batido de Chía y Frutos Rojos',     categoria:'batidos',      emoji:'🍒', desc:'Semillas de chía, frutos rojos variados, leche de avena y estevia.',                 proteina:'8g',  carbs:'32g', grasas:'8g',  kcal:'230', tag:'Batidos' },
  { id:37, nombre:'Batido Termogénico de Té Matcha',   categoria:'batidos',      emoji:'🍵', desc:'Matcha, plátano, espinaca y leche de almendras. Energía sostenida y enfoque.',        proteina:'6g',  carbs:'20g', grasas:'3g',  kcal:'130', tag:'Batidos' },
  { id:38, nombre:'Batido Hidratante de Pepino y Menta', categoria:'batidos',     emoji:'🥤', desc:'Pepino, menta fresca, limón y agua de coco. Refrescante e hidratante.',              proteina:'2g',  carbs:'14g', grasas:'0g',  kcal:'60',  tag:'Batidos' },
  { id:39, nombre:'Batido Proteico Vegano de Arveja',  categoria:'batidos',      emoji:'🌱', desc:'Proteína de arveja aislada, leche de soja, plátano y cacao puro.',                  proteina:'25g', carbs:'22g', grasas:'4g',  kcal:'220', tag:'Batidos' },
  { id:40, nombre:'Batido de Calabaza y Especias',     categoria:'batidos',      emoji:'🎃', desc:'Puré de calabaza, avena, leche de almendras, canela y nuez moscada.',                proteina:'8g',  carbs:'42g', grasas:'6g',  kcal:'250', tag:'Batidos' },
  { id:41, nombre:'Batido Nutritivo de Higos y Nueces', categoria:'batidos',      emoji:'🍇', desc:'Higos frescos, nueces picadas, yogur natural y leche. Alto en fibra y potasio.',     proteina:'8g',  carbs:'48g', grasas:'12g', kcal:'310', tag:'Batidos' },
  { id:42, nombre:'Batido de Avena y Cacao',           categoria:'batidos',      emoji:'🍫', desc:'Avena, cacao en polvo sin azúcar, leche descremada y edulcorante natural.',          proteina:'10g', carbs:'46g', grasas:'6g',  kcal:'270', tag:'Batidos' }
];

function getCatGradient(cat) {
  return { proteina:'linear-gradient(135deg,#FF3CAC,#784BA0)', carbohidratos:'linear-gradient(135deg,#FF7043,#FFD600)', recuperacion:'linear-gradient(135deg,#00E5A0,#00A8FF)', snack:'linear-gradient(135deg,#FF4E8A,#FF7043)', batidos:'linear-gradient(135deg,#784BA0,#2B86C5)' }[cat] || 'linear-gradient(135deg,#FF3CAC,#2B86C5)';
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

// ===================== IMAGE UTILITIES & WEBCAM =====================
function compressImage(file, maxWidth, maxHeight, quality, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
      } else {
        if (h > maxHeight) { w = Math.round((w * maxHeight) / h); h = maxHeight; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
  };
}

let webcamStream = null;

function openWebcamModal(onCapture) {
  // Remover modal existente si lo hay
  closeWebcamModal();

  const modal = document.createElement('div');
  modal.id = 'webcam-modal-container';
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal webcam-modal">
      <div class="modal-header">
        <h2>Tomar Foto</h2>
        <button class="modal-close" onclick="closeWebcamModal()">✕</button>
      </div>
      <div class="webcam-preview-container">
        <video id="webcam-video" autoplay playsinline></video>
        <div class="webcam-overlay-guide">Alinea al cliente</div>
      </div>
      <div class="modal-footer" style="justify-content: space-between;">
        <button type="button" class="btn-secondary" id="webcam-switch-btn" style="display:none; padding: 8px 12px; font-size: 13px;">🔄 Girar Cámara</button>
        <div style="display:flex; gap: 8px; margin-left: auto;">
          <button type="button" class="btn-secondary" onclick="closeWebcamModal()">Cancelar</button>
          <button type="button" class="btn-primary" id="webcam-capture-btn">📸 Capturar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const video = document.getElementById('webcam-video');
  const captureBtn = document.getElementById('webcam-capture-btn');
  const switchBtn = document.getElementById('webcam-switch-btn');

  let currentFacingMode = 'environment';
  let devices = [];

  async function startStream(facingMode) {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
    }
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = webcamStream;
    } catch (err) {
      console.error("Error al iniciar webcam, reintentando con valores por defecto...", err);
      try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = webcamStream;
      } catch (err2) {
        showToast("No se pudo acceder a la cámara", "error");
        closeWebcamModal();
      }
    }
  }

  // Detectar múltiples cámaras
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      devices = devs.filter(d => d.kind === 'videoinput');
      if (devices.length > 1) {
        switchBtn.style.display = 'block';
      }
    });
  }

  switchBtn.onclick = () => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    startStream(currentFacingMode);
  };

  captureBtn.onclick = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Comprimir en JPEG calidad 0.6
    onCapture(dataUrl);
    closeWebcamModal();
  };

  startStream(currentFacingMode);
}

function closeWebcamModal() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
  const modal = document.getElementById('webcam-modal-container');
  if (modal) modal.remove();
}

// ===================== REGISTRO DIARIO DE CONSUMO & METAS =====================
function getHoyKey() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `gym_diario_consumo_${yyyy}-${mm}-${dd}`;
}

function getMacrosConsumidosHoy() {
  const u = getActiveUser();
  if (!u) return { kcal: 0, proteina: 0, carbs: 0, grasas: 0 };
  const key = getHoyKey() + '_' + u.id;
  const data = localStorage.getItem(key);
  if (!data) return { kcal: 0, proteina: 0, carbs: 0, grasas: 0 };
  try { return JSON.parse(data); } catch(e) { return { kcal: 0, proteina: 0, carbs: 0, grasas: 0 }; }
}

async function registrarConsumoReceta(kcal, proteina, carbs, grasas) {
  const u = getActiveUser();
  if (!u) return;
  const key = getHoyKey() + '_' + u.id;
  const actual = getMacrosConsumidosHoy();
  actual.kcal     += parseInt(kcal)     || 0;
  actual.proteina += parseInt(proteina) || 0;
  actual.carbs    += parseInt(carbs)    || 0;
  actual.grasas   += parseInt(grasas)   || 0;
  localStorage.setItem(key, JSON.stringify(actual));
  await PersistDB.set(key, actual);
  window.dispatchEvent(new Event('gym_diario_actualizado'));
}

async function actualizarMacrosUsuarioActivo(kcal, prot, carbs, grasas) {
  const u = getActiveUser();
  if (!u) return;
  u.macroKcal  = parseInt(kcal)   || 2000;
  u.macroProt  = parseInt(prot)   || 150;
  u.macroCarbs = parseInt(carbs)  || 200;
  u.macroGrasas= parseInt(grasas) || 70;
  const db = getDB();
  const idx = db.usuarios.findIndex(user => user.id === u.id);
  if (idx !== -1) { db.usuarios[idx] = u; await saveDB(); }
  localStorage.setItem('gym_active_user', JSON.stringify(u));
  await PersistDB.set('gym_active_user', u);
  showToast('Objetivo de macros guardado en tu perfil', 'success');
}

// ── Init ───────────────────────────────────────────────────
loadDB();

// Inicializar persistencia en archivos
async function initPersist() {
  await PersistDB.init(
    async (usesFSA) => {
      // Carpeta conectada: migrar datos y recargar DB desde archivo
      hidePersistBanner();
      if (usesFSA) {
        await PersistDB.migrateFromLocalStorage(DB_KEYS);
        const dbFromFile = await PersistDB.get('romeo_db');
        if (dbFromFile && dbFromFile.usuarios && dbFromFile.usuarios.length >= DB.usuarios.length) {
          DB = dbFromFile;
          if (!DB.sesiones) DB.sesiones = [];
          // Notificar a páginas que se recargó la DB
          window.dispatchEvent(new Event('romeo_db_loaded'));
        }
        showPersistStatus(true);
      }
    },
    () => {
      // No hay carpeta elegida aún
      showPersistBanner();
    }
  );
}

function showPersistBanner() {
  if (document.getElementById('persist-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'persist-banner';
  banner.innerHTML = `
    <div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;
      background:linear-gradient(135deg,#1c1c1c,#222);border:1px solid rgba(255,60,172,0.4);
      border-radius:14px;padding:16px 22px;display:flex;align-items:center;gap:14px;
      box-shadow:0 8px 32px rgba(0,0,0,0.6);max-width:92vw;">
      <span style="font-size:28px;">💾</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:3px;">Conectar carpeta de datos</div>
        <div style="font-size:11px;color:#9A9A9A;line-height:1.4;">Elige la carpeta del proyecto para que los datos se guarden aunque se borre el caché.</div>
      </div>
      <button id="persist-pick-btn" style="background:linear-gradient(135deg,#FF3CAC,#784BA0);
        border:none;border-radius:10px;color:#fff;font-size:12px;font-weight:700;
        padding:10px 16px;cursor:pointer;white-space:nowrap;font-family:inherit;">
        📂 Elegir carpeta
      </button>
      <button id="persist-skip-btn" style="background:none;border:1px solid rgba(255,255,255,0.1);
        border-radius:10px;color:#9A9A9A;font-size:11px;padding:10px 12px;
        cursor:pointer;white-space:nowrap;font-family:inherit;">Ahora no</button>
    </div>`;
  document.body.appendChild(banner);
  document.getElementById('persist-pick-btn').onclick = async () => {
    const ok = await PersistDB.pickFolder();
    if (!ok) showToast('No se eligió ninguna carpeta', 'error');
  };
  document.getElementById('persist-skip-btn').onclick = () => hidePersistBanner();
}

function hidePersistBanner() {
  const b = document.getElementById('persist-banner');
  if (b) b.remove();
}

function showPersistStatus(ok) {
  // Pequeño indicador verde en la barra lateral
  const el = document.querySelector('.sidebar-role');
  if (el && ok) {
    el.innerHTML = 'Personal Trainer &nbsp;<span title="Datos guardados en archivo" style="color:#00E5A0;font-size:10px;">● archivo</span>';
  }
}

// Lanzar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPersist);
} else {
  setTimeout(initPersist, 100);
}

// Sincronizar la base de datos en tiempo real entre pestañas abiertas
window.addEventListener('storage', (e) => {
  if (e.key === 'romeo_db') {
    loadDB();
    window.dispatchEvent(new Event('romeo_db_loaded'));
  }
});
