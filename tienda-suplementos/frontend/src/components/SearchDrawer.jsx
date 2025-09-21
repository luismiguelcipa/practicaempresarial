import React, { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { products } from '../data/products';
import { Link } from 'react-router-dom';

const SearchDrawer = () => {
  const { isSearchOpen, closeSearch } = useUI();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products.filter((p) =>
      [p.name, p.category, p.description].some((f) => f?.toLowerCase().includes(term))
    );
  }, [q]);

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
              placeholder="Busca productos..."
              className="bg-transparent outline-none flex-1 text-sm"
            />
          </div>
          <button onClick={closeSearch} className="p-2 rounded hover:bg-gray-100" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[calc(100%-56px)]">
          {q && results.length === 0 && (
            <div className="p-6 text-gray-500 text-sm">Sin resultados para "{q}"</div>
          )}
          {results.length > 0 && (
            <ul className="divide-y">
              {results.map((p) => (
                <li key={p.id} className="p-4 hover:bg-gray-50">
                  <Link to={`/product/${p.id}`} onClick={closeSearch} className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded object-cover" />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.category} • ${p.price}</div>
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
