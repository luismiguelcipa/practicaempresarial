import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import ProductForm from '../components/admin/ProductForm';
import AdminPageManagement from '../components/AdminPageManagement';

// Lista completa de categorías (versión original)
const ALL_CATEGORIES = ['Proteínas','Creatina','Aminoácidos','Pre-Workout','Vitaminas','Para la salud','Complementos','Comida'];

// Tipos/Subcategorías por categoría
const CATEGORY_TYPES = {
  'Proteínas': ['Limpia', 'Hipercalórica', 'Vegana'],
  'Creatina': ['Monohidrato', 'HCL']
};

// Página administración de productos con selección previa de categoría
export default function AdminProducts() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // producto en edición
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // nueva: categoría elegida
  const [selectedType, setSelectedType] = useState(null); // subcategoría/tipo elegido
  const [search, setSearch] = useState('');
  // Usuarios
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [showUsers, setShowUsers] = useState(false);

  // Combos
  const [combos, setCombos] = useState([]);
  const [combosLoading, setCombosLoading] = useState(false);
  const [combosError, setCombosError] = useState(null);

  const emptyProduct = { name:'', description:'', price:'', category:'Proteínas', tipo:'', image:'', inStock:true, isActive:true, baseSize:'', variants:[], flavors:[] };
  const [form, setForm] = useState(emptyProduct);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/products?includeInactive=true&limit=500');
      setProducts(data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true); setUsersError(null);
      const { data } = await axios.get('/api/users?limit=500');
      setUsers(data.data || []);
    } catch (e) {
      setUsersError(e.response?.data?.message || 'Error cargando usuarios');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (showUsers && users.length === 0 && !usersLoading) {
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUsers]);

  const fetchCombos = async () => {
    try {
      setCombosLoading(true);
      setCombosError(null);
      const { data } = await axios.get('/api/combos');
      setCombos(data || []);
    } catch (e) {
      setCombosError(e.response?.data?.message || 'Error cargando combos');
    } finally {
      setCombosLoading(false);
    }
  };

  useEffect(() => { 
    fetchCombos(); 
  }, []);

  // Derivar categorías únicas asegurando mostrar todas las soportadas (aunque tengan 0 productos)
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category || 'Sin categoría'));
    ALL_CATEGORIES.forEach(c => set.add(c));
    return ALL_CATEGORIES.filter(c => set.has(c)); // preserva orden lógico definido arriba
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) {
      list = list.filter(p => (p.category || 'Sin categoría') === selectedCategory);
    }
    // Filtrar por tipo/subcategoría si está seleccionado
    if (selectedType) {
      list = list.filter(p => {
        const productType = p.tipo || (p.category === 'Proteínas' ? 'Limpia' : p.category === 'Creatina' ? 'Monohidrato' : null);
        return productType === selectedType;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedCategory, selectedType, search]);

  // Manejar selección de categoría
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setSelectedType(null); // Resetear tipo al cambiar categoría
    setSearch(''); // Limpiar búsqueda
  };

  // Manejar selección de tipo/subcategoría
  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  // Volver al panel de categorías
  const backToCategories = () => {
    setSelectedCategory(null);
    setSelectedType(null);
    setSearch('');
  };

  // Volver al panel de tipos (solo si estamos en una subcategoría)
  const backToTypes = () => {
    setSelectedType(null);
    setSearch('');
  };

  const openCreate = () => { 
    setEditing(null); 
    setForm({ 
      ...emptyProduct, 
      category: selectedCategory || selectedType ? (selectedCategory || emptyProduct.category) : '', // Vacío si estamos en el panel principal
      tipo: selectedType || '' 
    }); 
    setModalOpen(true); 
  };

  const openEdit = (p) => { setEditing(p); setForm({
    name: p.name || '',
    description: p.description || '',
    price: p.price ?? '',
    category: p.category || 'Proteínas',
    tipo: p.tipo || '',
    image: p.image || '',
    inStock: p.inStock !== false,
    isActive: p.isActive,
    baseSize: p.baseSize || '',
    variants: Array.isArray(p.variants) ? p.variants : [],
    flavors: Array.isArray(p.flavors) ? p.flavors : []
  }); setModalOpen(true); };

  const saveProduct = async (payload) => { setSaving(true); setError(null); try { if (editing) { await axios.put(`/api/products/${editing._id}`, payload); } else { await axios.post('/api/products', payload); } setModalOpen(false); await fetchProducts(); } catch (e) { setError(e.response?.data?.message || 'Error guardando'); } finally { setSaving(false); } };

  const toggleActive = async (p) => {
    try {
      await axios.put(`/api/products/${p._id}`, { isActive: !p.isActive });
      setProducts(ps => ps.map(x => x._id === p._id ? { ...x, isActive: !p.isActive } : x));
    } catch {
      alert('Error cambiando estado');
    }
  };

  // Eliminación permanente (antes soft delete)
  const deleteProduct = async (p) => {
    if (!confirm('¿Eliminar este producto definitivamente? Esta acción no se puede deshacer.')) return;
    try {
      await axios.delete(`/api/products/${p._id}`);
      // Remover del estado local
      setProducts(ps => ps.filter(x => x._id !== p._id));
    } catch (e) {
      alert('Error eliminando: ' + (e.response?.data?.message || 'intenta de nuevo'));
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return <div className="p-8 text-center text-sm text-red-600">Acceso restringido.</div>;
  }

  // Vista 1: Selección de categoría
  if (!selectedCategory) {
    return (
      <div className="pt-24 md:pt-28 p-6 max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Panel de Productos</h1>
            <p className="text-sm text-gray-600">Selecciona una categoría para gestionarla.</p>
          </div>
          
          {/* Botones de acción */}
          <div className="flex gap-3 items-center">
            <button onClick={fetchProducts} className="text-xs px-3 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200">Refrescar</button>
            
            {/* Botón verde para crear producto */}
            <button
              onClick={openCreate}
              title="Agregar Nuevo Producto"
              className="group cursor-pointer outline-none duration-300 hover:rotate-90 p-0 bg-transparent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="50px"
                height="50px"
                viewBox="0 0 24 24"
                className="stroke-green-400 fill-none group-hover:fill-green-800 group-active:stroke-green-200 group-active:fill-green-600 group-active:duration-0 duration-300"
              >
                <path
                  d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                  strokeWidth="1.5"
                ></path>
                <path d="M8 12H16" strokeWidth="1.5"></path>
                <path d="M12 16V8" strokeWidth="1.5"></path>
              </svg>
            </button>
          </div>
        </header>

        {loading && <p className="text-sm text-gray-500">Cargando categorías...</p>}
  {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}

        {!loading && categories.length === 0 && (
          <div className="text-sm text-gray-500">No hay productos aún.</div>
        )} 

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map(cat => {
            // Conteos e indicadores
            const total = products.filter(p => (p.category || 'Sin categoría') === cat).length;
            const activos = products.filter(p => (p.category || 'Sin categoría') === cat && p.isActive).length;
            const inactivos = total - activos;
            const sinStock = products.filter(p => (p.category || 'Sin categoría') === cat && p.inStock === false).length;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className="group relative p-6 rounded-xl shadow-sm hover:shadow-lg border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:from-red-50 hover:to-orange-50 hover:border-black transition-all duration-300 flex flex-col text-left transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-red-700 transition-colors">{cat}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {total} producto{total!==1?'s':''}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-all">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {activos}
                  </span>
                  {inactivos>0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                      {inactivos}
                    </span>
                  )}
                  {sinStock>0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {sinStock}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 group-hover:border-red-200 transition-colors">
                  <span className="text-sm text-red-600 font-semibold group-hover:text-red-700 flex items-center gap-1">
                    Administrar
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel de Usuarios */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Usuarios Registrados</h2>
            <div className="flex gap-2">
              <button onClick={()=> setShowUsers(v=> !v)} className="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50">
                {showUsers ? 'Ocultar' : 'Mostrar'}
              </button>
              {showUsers && <button onClick={fetchUsers} disabled={usersLoading} className="text-xs px-3 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50">Refrescar</button>}
            </div>
          </div>
          <p className="text-xs text-gray-500">Solo lectura. El administrador no puede editar ni eliminar usuarios desde aquí.</p>
          {showUsers && (
            <div className="border rounded bg-white overflow-auto">
              {usersError && <div className="text-xs text-red-600 bg-red-50 border-b border-red-200 px-3 py-2">{usersError}</div>}
              {usersLoading ? (
                <div className="p-4 text-sm text-gray-500">Cargando usuarios...</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="p-2">Email</th>
                      <th className="p-2">Nombre</th>
                      <th className="p-2">Rol</th>
                      <th className="p-2">Verificado</th>
                      <th className="p-2">Último login</th>
                      <th className="p-2">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
                      return (
                        <tr key={u._id || u.id} className="hover:bg-gray-50">
                          <td className="p-2 font-mono text-xs">{u.email}</td>
                          <td className="p-2 text-xs">{fullName}</td>
                          <td className="p-2 text-xs"><span className={`px-2 py-0.5 rounded text-[10px] ${u.role==='admin'?'bg-purple-100 text-purple-700':'bg-gray-200 text-gray-700'}`}>{u.role}</span></td>
                          <td className="p-2 text-xs">{u.isEmailVerified ? 'Sí' : 'No'}</td>
                          <td className="p-2 text-[10px] text-gray-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}</td>
                          <td className="p-2 text-[10px] text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && !usersLoading && !usersError && (
                      <tr><td colSpan="6" className="p-4 text-center text-gray-500 text-xs">Sin usuarios</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>

        {/* Nuevo Panel: Administración de Página */}
        <AdminPageManagement />

        {/* Panel de Combos */}
        <section className="space-y-6 mt-12">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Panel de Combos</h2>
              <p className="text-sm text-gray-600">Gestiona los combos de Volumen y Definición.</p>
            </div>
            
            {/* Botón de refrescar */}
            <button 
              onClick={fetchCombos} 
              className="text-xs px-3 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            >
              Refrescar Combos
            </button>
          </header>

          {combosLoading && <p className="text-sm text-gray-500">Cargando combos...</p>}
          {combosError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{combosError}</div>}

          {/* Tarjetas de categorías de combos */}
          <div className="grid sm:grid-cols-2 gap-5">
            {['Volumen', 'Definición'].map(category => {
              const categoryCount = combos.filter(c => c.category === category).length;
              const inStockCount = combos.filter(c => c.category === category && c.inStock).length;
              
              return (
                <button
                  key={category}
                  onClick={() => navigate(`/admin/combos/${category.toLowerCase()}`)}
                  className="group relative p-6 rounded-xl shadow-sm hover:shadow-lg border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:from-red-50 hover:to-orange-50 hover:border-red-300 transition-all duration-300 flex flex-col text-left transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-red-700 transition-colors">{category}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {categoryCount} combo{categoryCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-all">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {inStockCount}
                    </span>
                    
                    {(categoryCount - inStockCount) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {categoryCount - inStockCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between text-xs text-red-600 group-hover:text-red-700 font-medium">
                    <span>Administrar {category}</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Modal de creación/edición de producto */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-2">{editing? 'Editar Producto':'Nuevo Producto'}</h2>
              <ProductForm
                initialValue={form}
                saving={saving}
                editingMode={!!editing}
                categoryLocked={false}
                onCancel={()=>setModalOpen(false)}
                onSave={saveProduct}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista 2: Selección de tipo/subcategoría (solo para Proteínas y Creatina)
  const categoryHasTypes = CATEGORY_TYPES[selectedCategory];
  if (categoryHasTypes && !selectedType) {
    return (
      <div className="pt-24 md:pt-28 p-6 max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <button 
              onClick={backToCategories}
              className="text-xs text-indigo-600 hover:underline mb-2 flex items-center gap-1"
            >
              ← Volver a categorías
            </button>
            <h1 className="text-2xl font-bold mb-1">Categoría: {selectedCategory}</h1>
            <p className="text-sm text-gray-600">Selecciona un tipo para gestionar sus productos.</p>
          </div>
          
          {/* Botones de acción */}
          <div className="flex gap-3 items-center">
            {/* Botón rojo para volver */}
            <button 
              onClick={backToCategories}
              className="bg-white text-center border w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
              type="button"
            >
              <div className="bg-red-700 rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1024 1024"
                  height="25px"
                  width="25px"
                >
                  <path
                    d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
                    fill="#ffffffff"
                  ></path>
                  <path
                    d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                    fill="#ffffffff"
                  ></path>
                </svg>
              </div>
              <p className="translate-x-2">Categorias</p>
            </button>

            {/* Botón verde para agregar (aunque no se usará aquí, se mantiene el diseño) */}
            <button
              onClick={openCreate}
              title="Agregar Nuevo Producto"
              className="group cursor-pointer outline-none duration-300 hover:rotate-90 p-0 bg-transparent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="50px"
                height="50px"
                viewBox="0 0 24 24"
                className="stroke-green-400 fill-none group-hover:fill-green-800 group-active:stroke-green-200 group-active:fill-green-600 group-active:duration-0 duration-300"
              >
                <path
                  d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                  strokeWidth="1.5"
                ></path>
                <path d="M8 12H16" strokeWidth="1.5"></path>
                <path d="M12 16V8" strokeWidth="1.5"></path>
              </svg>
            </button>
          </div>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categoryHasTypes.map(tipo => {
            // Conteos por tipo
            const productosEnCategoria = products.filter(p => p.category === selectedCategory);
            const total = productosEnCategoria.filter(p => {
              const productType = p.tipo || (selectedCategory === 'Proteínas' ? 'Limpia' : 'Monohidrato');
              return productType === tipo;
            }).length;
            const activos = productosEnCategoria.filter(p => {
              const productType = p.tipo || (selectedCategory === 'Proteínas' ? 'Limpia' : 'Monohidrato');
              return productType === tipo && p.isActive;
            }).length;
            const inactivos = total - activos;
            const sinStock = productosEnCategoria.filter(p => {
              const productType = p.tipo || (selectedCategory === 'Proteínas' ? 'Limpia' : 'Monohidrato');
              return productType === tipo && p.inStock === false;
            }).length;

            return (
              <button
                key={tipo}
                onClick={() => handleTypeSelect(tipo)}
                className="group relative p-6 rounded-xl shadow-sm hover:shadow-lg border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:from-rose-50 hover:to-pink-50 hover:border-rose-300 transition-all duration-300 flex flex-col text-left transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-rose-700 transition-colors">{tipo}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {total} producto{total!==1?'s':''}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center transition-all">
                    <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {activos}
                  </span>
                  {inactivos>0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                      {inactivos}
                    </span>
                  )}
                  {sinStock>0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {sinStock}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 group-hover:border-rose-200 transition-colors">
                  <span className="text-sm text-rose-600 font-semibold group-hover:text-rose-700 flex items-center gap-1">
                    Ver Productos
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal de creación/edición de producto */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-2">{editing? 'Editar Producto':'Nuevo Producto'}</h2>
              <ProductForm
                initialValue={form}
                saving={saving}
                editingMode={!!editing}
                categoryLocked={!editing}
                onCancel={()=>setModalOpen(false)}
                onSave={saveProduct}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista 3: Tabla filtrada por categoría y tipo seleccionados
  return (
    <div className="pt-24 md:pt-28 p-6 max-w-7xl mx-auto space-y-6">
  <header className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-3">
            {/* Breadcrumb mejorado */}
            <nav className="flex items-center gap-2 text-sm">
              <button 
                onClick={backToCategories}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-red-100 text-red-600 font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Categorías
              </button>
              
              {categoryHasTypes && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <button 
                    onClick={backToTypes}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-100 text-rose-600 font-medium transition-all"
                  >
                    {selectedCategory}
                  </button>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold">
                    {selectedType}
                  </span>
                </>
              )}
              
              {!categoryHasTypes && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold">
                    {selectedCategory}
                  </span>
                </>
              )}
            </nav>
          
            {/* Título y contador */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {selectedCategory}
                {selectedType && <span className="text-red-600"> · {selectedType}</span>}
              </h1>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                {filteredProducts.length} {filteredProducts.length!==1?'productos':'producto'}
              </span>
            </div>
          </div>
  
          {/* Búsqueda y filtros */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative w-full sm:w-[280px]">
              <input
                id="admin_search_field"
                type="text"
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full h-10 pl-10 pr-10 text-sm bg-white border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button
                  type="button"
                  onClick={()=>setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Limpiar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Botón volver */}
            <button 
              onClick={() => categoryHasTypes ? backToTypes() : backToCategories()}
              className="bg-white text-center border border-gray-300 w-48 rounded-xl h-10 relative text-black text-base font-semibold group hover:border-red-400 transition-all"
              type="button"
            >
              <div className="bg-red-600 rounded-lg h-8 w-1/4 flex items-center justify-center absolute left-1 top-[3px] group-hover:w-[184px] z-10 duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="20px" width="20px">
                  <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" fill="#ffffffff"></path>
                  <path d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" fill="#ffffffff"></path>
                </svg>
              </div>
              <p className="translate-x-2">{categoryHasTypes ? selectedCategory : 'Categorías'}</p>
            </button>
            
            {/* Botón agregar producto */}
            <button
              onClick={openCreate}
              title="Agregar Nuevo Producto"
              className="group cursor-pointer outline-none hover:rotate-90 transition-transform duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" viewBox="0 0 24 24" className="stroke-red-600 fill-none group-hover:fill-red-600 group-hover:stroke-red-700 transition-all duration-300">
                <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" strokeWidth="1.5"></path>
                <path d="M8 12H16" strokeWidth="1.5"></path>
                <path d="M12 16V8" strokeWidth="1.5"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
        </div>
      ) : (
  <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-200">
                <tr className="text-xs uppercase tracking-wide text-gray-700 font-semibold">
                  <th className="p-4 text-left">Producto</th>
                  <th className="p-4 text-left">Precio</th>
                  <th className="p-4 text-left">Disponibilidad</th>
                  <th className="p-4 text-left">Estado</th>
                  <th className="p-4 text-center w-64">Acciones</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map(p => (
                <tr key={p._id} className={`transition-colors ${p.isActive ? 'hover:bg-red-50/50' : 'opacity-60 hover:bg-gray-50'}`}>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      {(!p.variants || p.variants.length===0) && p.baseSize && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                          </svg>
                          Base: {p.baseSize}
                        </span>
                      )}
                      {p.image && (
                        <span className="text-xs text-gray-500 truncate max-w-[200px] flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {p.image}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-red-600 text-base">${p.price}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${p.inStock !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.inStock !== false ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Disponible
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Sin stock
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${p.isActive?'bg-green-100 text-green-700':'bg-gray-200 text-gray-600'}`}>
                      {p.isActive ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Activo
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                          Inactivo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 items-center justify-center flex-wrap">
                      {/* Editar */}
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        title="Editar producto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      {/* Activar/Desactivar */}
                      <button
                        onClick={() => toggleActive(p)}
                        title={p.isActive ? 'Desactivar producto' : 'Activar producto'}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 h-9 text-xs font-medium rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ${
                          p.isActive 
                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                        {p.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      {p.isActive && (
                        /* Eliminar */
                        <button
                          onClick={() => deleteProduct(p)}
                          type="button"
                          title="Eliminar producto definitivamente"
                          className="inline-flex items-center justify-center gap-1.5 px-3 h-9 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-600 font-medium">No hay productos en esta categoría</p>
                      <button onClick={openCreate} className="text-red-600 hover:text-red-700 text-sm font-semibold">
                        + Agregar primer producto
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Nuevo Panel: Administración de Página */}
      <AdminPageManagement />

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          {/* Contenedor con altura máxima y scroll interno */}
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2">{editing? 'Editar Producto':'Nuevo Producto'}</h2>
            <ProductForm
              initialValue={form}
              saving={saving}
              editingMode={!!editing}
              categoryLocked={!editing}
              onCancel={()=>setModalOpen(false)}
              onSave={saveProduct}
            />
          </div>
        </div>
      )}
    </div>
  );
}
