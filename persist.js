/* ============================================================
   ROMEO PT — Persistencia en Archivos Locales v1.0
   Usa File System Access API para guardar datos como archivos
   .json reales en la carpeta del proyecto. Sin instalación,
   sin internet. Los datos sobreviven borrado de caché.
   ============================================================ */

const PersistDB = (() => {
  const IDB_NAME    = 'romeo_pt_fsh';
  const IDB_STORE   = 'handles';
  const HANDLE_KEY  = 'data_dir';
  const DATA_FOLDER = 'data';

  let _dirHandle  = null;
  let _rootHandle = null;
  let _ready      = false;
  let _useFSA     = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  let _onReady    = null;
  let _onNeedPerm = null;

  function openIDB() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
      req.onsuccess = e => res(e.target.result);
      req.onerror   = e => rej(e);
    });
  }

  async function idbGet(db, key) {
    return new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = e => res(e.target.result);
      req.onerror   = e => rej(e);
    });
  }

  async function idbSet(db, key, val) {
    return new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = () => res();
      tx.onerror    = e => rej(e);
    });
  }

  async function getDataDir(root) {
    return await root.getDirectoryHandle(DATA_FOLDER, { create: true });
  }

  async function readFile(name) {
    if (!_dirHandle) return null;
    try {
      const fh   = await _dirHandle.getFileHandle(name + '.json');
      const file = await fh.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch { return null; }
  }

  async function writeFile(name, data) {
    if (!_dirHandle) return false;
    try {
      const fh       = await _dirHandle.getFileHandle(name + '.json', { create: true });
      const writable = await fh.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (e) { console.warn('[PersistDB] writeFile error:', e); return false; }
  }

  async function verifyPermission(handle) {
    if (!handle) return false;
    try {
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') return true;
      const asked = await handle.requestPermission({ mode: 'readwrite' });
      return asked === 'granted';
    } catch { return false; }
  }

  async function init(onReady, onNeedPerm) {
    _onReady    = onReady    || (() => {});
    _onNeedPerm = onNeedPerm || (() => {});

    if (!_useFSA) {
      console.warn('[PersistDB] File System Access API no disponible, usando localStorage.');
      _ready = true;
      _onReady(false);
      return;
    }

    try {
      const db     = await openIDB();
      const handle = await idbGet(db, HANDLE_KEY);
      if (handle) {
        const ok = await verifyPermission(handle);
        if (ok) {
          _rootHandle = handle;
          _dirHandle  = await getDataDir(handle);
          _ready = true;
          _onReady(true);
          return;
        }
      }
    } catch (e) { console.warn('[PersistDB] Error al restaurar handle:', e); }

    _onNeedPerm();
  }

  async function pickFolder() {
    if (!_useFSA) return false;
    try {
      const root = await window.showDirectoryPicker({ id: 'romeo-pt-data', mode: 'readwrite', startIn: 'documents' });
      const ok   = await verifyPermission(root);
      if (!ok) return false;
      _rootHandle = root;
      _dirHandle  = await getDataDir(root);
      const db = await openIDB();
      await idbSet(db, HANDLE_KEY, root);
      _ready = true;
      if (_onReady) _onReady(true);
      return true;
    } catch (e) { if (e.name !== 'AbortError') console.warn('[PersistDB] pickFolder error:', e); return false; }
  }

  async function get(key) {
    if (_useFSA && _dirHandle) {
      const val = await readFile(key);
      if (val !== null) return val;
    }
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; }
    catch { return null; }
  }

  async function set(key, value) {
    if (_useFSA && _dirHandle) {
      const ok = await writeFile(key, value);
      if (ok) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} return true; }
    }
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  async function migrateFromLocalStorage(keys) {
    if (!_useFSA || !_dirHandle) return;
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) { const ex = await readFile(key); if (ex === null) await writeFile(key, JSON.parse(raw)); }
      } catch {}
    }
  }

  return {
    init, pickFolder, get, set, migrateFromLocalStorage,
    isReady: () => _ready,
    usesFSA: () => _useFSA && !!_dirHandle
  };
})();
