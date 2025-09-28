import React, { useMemo, useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { products as staticProducts } from '../data/products';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';

const MIN_LEN = 2; // permitir búsqueda desde 2 caracteres

// Normaliza texto: minúsculas, sin tildes
const normalize = (str='') => str
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu,'');

const highlight = (text, term) => {
  if (!term) return text;
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const regex = new RegExp(`(${safe})`,'ig');
  return text.split(regex).map((part,i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> : part
  );
};

const SearchDrawer = () => {
  const { isSearchOpen, closeSearch } = useUI();
  const [q, setQ] = useState('');
  const [dynamicProducts, setDynamicProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Cargar productos dinámicos (si backend disponible) una sola vez al abrir
  useEffect(() => {
    if (isSearchOpen && dynamicProducts.length === 0 && !loading) {
      (async () => {
        try {
          setLoading(true); setLoadError(null);
          const { data } = await axios.get('/api/products?limit=500&includeInactive=false');
          setDynamicProducts(data.data || []);
        } catch {
          setLoadError('No se pudieron cargar productos en vivo (usando lista local).');
        } finally { setLoading(false); }
      })();
    }
  }, [isSearchOpen, dynamicProducts.length, loading]);

  // Dataset combinado: si hay dinámicos, los fusiona con los estáticos que aún no existen (por nombre)
  const dataset = useMemo(() => {
    if (dynamicProducts.length === 0) return staticProducts;
    const map = new Map();
    dynamicProducts.forEach(p => {
      if (p && p.name) map.set(normalize(p.name), p);
    });
    staticProducts.forEach(p => {
      if (p && p.name && !map.has(normalize(p.name))) {
        map.set(normalize(p.name), p);
      }
    });
    return Array.from(map.values());
  }, [dynamicProducts]);

  const results = useMemo(() => {
    const termRaw = q.trim();
    if (!termRaw || termRaw.length < MIN_LEN) return [];
    const term = normalize(termRaw);
    return dataset.filter((p) => {
      const name = normalize(p.name || '');
      const cat = normalize(p.category || '');
      const desc = normalize(p.description || '');
      const baseSize = normalize(p.baseSize || '');
      const variantSizes = Array.isArray(p.variants) ? p.variants.map(v => normalize(v.size || '')).join(' ') : '';
      const hay = name.includes(term) || cat.includes(term) || desc.includes(term) || (baseSize && baseSize.includes(term)) || (variantSizes && variantSizes.includes(term));
      return hay;
    }).slice(0,50); // limitar para performance
  }, [q, dataset]);

  const showHintMin = q.trim().length > 0 && q.trim().length < MIN_LEN;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 z-[9996] ${
          isSearchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSearch}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white z-[9997] shadow-2xl transform transition-transform duration-300 ${
          isSearchOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Buscar productos"
      >
        {/* Header/Input */}
        <div className="p-3 border-b flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 bg-gray-100 rounded-lg px-3 py-2">
            <Search size={18} className="text-gray-500" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca productos... (mín. 2 letras)"
              className="bg-transparent outline-none flex-1 text-sm"
            />
            {q && (
              <button onClick={()=>setQ('')} className="text-gray-400 hover:text-gray-600 text-xs" aria-label="Limpiar">✕</button>
            )}
          </div>
          <button onClick={closeSearch} className="p-2 rounded hover:bg-gray-100" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Estado carga dataset dinámico */}
        {loading && (
          <div className="px-4 py-2 text-xs text-gray-500 border-b">Cargando productos en vivo...</div>
        )}
        {loadError && (
          <div className="px-4 py-2 text-xs text-amber-600 bg-amber-50 border-b border-amber-200">{loadError}</div>
        )}

        {/* Results */}
        <div className="overflow-y-auto max-h-[calc(100%-56px)]">
          {showHintMin && (
            <div className="p-6 text-gray-400 text-sm">Escribe al menos {MIN_LEN} caracteres…</div>
          )}
          {!showHintMin && q && results.length === 0 && (
            <div className="p-6 text-gray-500 text-sm">Sin resultados para "{q}"</div>
          )}
          {!q && (
            <div className="p-6 text-xs text-gray-400 space-y-2">
              <p className="font-medium text-gray-500 text-sm">Sugerencias:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Escribe parte del nombre (ej: "crea", "imn")</li>
         
                <li>También puedes buscar por descripción.</li>
              </ul>
            </div>
          )}
          {results.length > 0 && (
            <ul className="divide-y">
              {results.map((p) => (
                <li key={p._id || p.id} className="p-4 hover:bg-gray-50">
                  <Link to={`/product/${p._id || p.id}`} onClick={closeSearch} className="flex items-center gap-3">
                    {p.image && <img src={p.image} alt={p.name} className="w-12 h-12 rounded object-cover" />}
                    <div className="min-w-0">
                      <div className="font-medium break-words">{highlight(p.name, q.trim())}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {highlight(p.category, q.trim())} • ${p.price}
                        {!p.variants?.length && p.baseSize && (
                          <span className="ml-1 text-[10px] text-indigo-600">[{p.baseSize}]</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
};

export default SearchDrawer;
