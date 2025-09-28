import { useEffect, useState, useMemo } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import ProductForm from '../components/admin/ProductForm';

// Página administración de productos con selección previa de categoría
export default function AdminProducts() {
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // producto en edición
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // nueva: categoría elegida
  const [search, setSearch] = useState('');
  // Usuarios
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [showUsers, setShowUsers] = useState(false);

  const emptyProduct = { name:'', description:'', price:'', category:'Proteínas', image:'', stock:0, isActive:true, baseSize:'', variants:[], flavors:[] };
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

  // Derivar categorías únicas
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category || 'Sin categoría'));
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) {
      list = list.filter(p => (p.category || 'Sin categoría') === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedCategory, search]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyProduct, category: selectedCategory || emptyProduct.category }); setModalOpen(true); };

  const openEdit = (p) => { setEditing(p); setForm({
    name: p.name || '',
    description: p.description || '',
    price: p.price ?? '',
    category: p.category || 'Proteínas',
    image: p.image || '',
    stock: p.stock ?? 0,
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
          <button onClick={fetchProducts} className="self-start text-xs px-3 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200">Refrescar</button>
        </header>

        {loading && <p className="text-sm text-gray-500">Cargando categorías...</p>}
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}

        {!loading && categories.length === 0 && (
          <div className="text-sm text-gray-500">No hay productos aún.</div>
        )} 

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(cat => {
            // Conteos e indicadores
            const total = products.filter(p => (p.category || 'Sin categoría') === cat).length;
            const activos = products.filter(p => (p.category || 'Sin categoría') === cat && p.isActive).length;
            const inactivos = total - activos;
            const sinStock = products.filter(p => (p.category || 'Sin categoría') === cat && p.stock === 0).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="group relative p-4 rounded-lg border bg-white shadow-sm hover:shadow transition flex flex-col text-left"
              >
                <span className="text-base font-semibold text-gray-800 group-hover:text-indigo-600">{cat}</span>
                <span className="text-xs text-gray-500 mt-1">{total} producto{total!==1?'s':''}</span>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">Activos {activos}</span>
                  {inactivos>0 && <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Inactivos {inactivos}</span>}
                  {sinStock>0 && <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">Sin stock {sinStock}</span>}
                </div>
                <span className="mt-4 inline-block text-xs text-indigo-600 font-medium group-hover:underline">Administrar →</span>
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
      </div>
    );
  }

  // Vista 2: Tabla filtrada por categoría seleccionada
  return (
    <div className="pt-24 md:pt-28 p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Categoría: {selectedCategory}</h1>
          <p className="text-xs text-gray-500">Mostrando {filteredProducts.length} producto{filteredProducts.length!==1?'s':''}</p>
        </div>
  <div className="flex flex-wrap gap-3 items-center mt-2">
    {/* Barra de búsqueda (label flotante) */}
          <div className="relative w-[230px]" id="admin-search-input">
            <input
              id="admin_search_field"
              type="text"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="block w-full text-sm h-[30px] px-4 text-slate-900 bg-white rounded-[8px] border border-black appearance-none focus:border-transparent focus:outline focus:outline-2 focus:outline-indigo-500 focus:ring-0 hover:border-black peer invalid:border-red-500 invalid:focus:border-red-500 overflow-ellipsis overflow-hidden text-nowrap pr-[48px]"
            />
            <label
              htmlFor="admin_search_field"
              className="peer-placeholder-shown:-z-10 peer-focus:z-10 absolute text-[14px] leading-[150%] text-black peer-focus:text-indigo-600 peer-invalid:text-red-500 duration-300 transform -translate-y-[1.2rem] scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-[1.2rem] start-1">
              Buscar
            </label>
            {search && (
              <button
                type="button"
                onClick={()=>setSearch('')}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-xs text-gray-500 hover:text-black"
                title="Limpiar"
              >
                x
              </button>
            )}
          
          </div>
    {/* Botón para volver a la vista anterior */}
<button onClick={() => setSelectedCategory(null)}
  className="bg-white text-center border  w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
  type="button"
>
  <div
    className="bg-red-700 rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500"
  >
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
{/* Botón para agregar un nuevo producto */}
          <button
            onClick={openCreate}
            title="Agregar Nuevo Producto"
            className="group cursor-pointer outline-none duration-300 hover:rotate-90 p-0 bg-transparent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40px"
              height="40px"
              viewBox="0 0 24 24"
              className="stroke-green-500 fill-none group-hover:fill-green-800 group-active:stroke-green-300 group-active:fill-green-600 group-active:duration-0 duration-300"
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

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}
      {loading ? <p className="text-sm text-gray-500">Cargando...</p> : (
        <div className="overflow-auto border rounded bg-gray-100">
          <table className="min-w-full text-sm text-gray-800">
            <thead className="bg-gray-200 text-left">
              <tr className="text-xs uppercase tracking-wide text-gray-700">
                <th className="p-2">Nombre</th>
                <th className="p-2">Precio</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Activo</th>
                <th className="p-2 w-52">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p._id} className={p.isActive ? 'hover:bg-gray-100 transition-colors' : 'opacity-60 hover:bg-gray-100 transition-colors'}>
                  <td className="p-2 font-medium flex flex-col gap-1 text-gray-900">
                    <span>{p.name}</span>
                    {(!p.variants || p.variants.length===0) && p.baseSize && (
                      <span className="text-[10px] text-indigo-600 font-medium">Base: {p.baseSize}</span>
                    )}
                    {p.image && <span className="text-[10px] text-gray-500 truncate max-w-[180px]">{p.image}</span>}
                  </td>
                  <td className="p-2 text-gray-900">${p.price}</td>
                  <td className={`p-2 ${p.stock===0?'text-red-600 font-semibold':p.stock<5?'text-amber-600':''}`}>{p.stock}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium shadow-sm ${p.isActive?'bg-green-200 text-green-800':'bg-gray-400 text-gray-800'}`}>{p.isActive? 'Sí':'No'}</span>
                  </td>
                  <td className="p-2 flex gap-1.5 items-center flex-nowrap">
                    {/* Editar */}
                    <button
                      onClick={() => openEdit(p)}
                      className="inline-flex items-center justify-center gap-1 px-3 h-[28px] bg-blue-600 ease-in-out delay-75 hover:bg-blue-700 text-white text-[11px] font-medium rounded-md hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-200 whitespace-nowrap"
                      title="Editar"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 16 16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10ZM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5Zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6-6ZM3.032 12.675l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325Z"
                          strokeWidth="0.5"
                        ></path>
                      </svg>
                      Editar
                    </button>
                    {/* Activar/Desactivar */}
                    <button
                      onClick={() => toggleActive(p)}
                      title={p.isActive ? 'Desactivar producto' : 'Activar producto'}
                      className="cursor-pointer flex items-center gap-1 fill-lime-400 bg-lime-950 hover:bg-lime-900 active:border active:border-lime-400 rounded-md px-2 h-[28px] text-[11px] whitespace-nowrap transition-all duration-200 ease-in-out hover:-translate-y-1 hover:scale-110 active:scale-95"
                    >
                      <svg viewBox="0 -0.5 25 25" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.5" d="M18.507 19.853V6.034C18.5116 5.49905 18.3034 4.98422 17.9283 4.60277C17.5532 4.22131 17.042 4.00449 16.507 4H8.50705C7.9721 4.00449 7.46085 4.22131 7.08577 4.60277C6.7107 4.98422 6.50252 5.49905 6.50705 6.034V19.853C6.45951 20.252 6.65541 20.6407 7.00441 20.8399C7.35342 21.039 7.78773 21.0099 8.10705 20.766L11.907 17.485C12.2496 17.1758 12.7705 17.1758 13.113 17.485L16.9071 20.767C17.2265 21.0111 17.6611 21.0402 18.0102 20.8407C18.3593 20.6413 18.5551 20.2522 18.507 19.853Z" clipRule="evenodd" fillRule="evenodd"></path>
                      </svg>
                      <span className="text-[11px] text-lime-400 font-bold pr-0">{p.isActive ? 'Desactivar' : 'Activar'}</span>
                    </button>
                    {p.isActive && (
                      /* eliminar definitivamente */
                      <button
                        onClick={() => deleteProduct(p)}
                        type="button"
                        title="Eliminar producto definitivamente"
                        className="inline-flex items-center gap-1 px-3 h-[28px] bg-red-600 transition ease-in-out delay-75 hover:bg-red-700 text-white text-[11px] font-medium rounded-md hover:-translate-y-1 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                      >
                        <svg
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          ></path>
                        </svg>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !loading && (
                <tr><td colSpan="5" className="p-4 text-center text-gray-600">Sin productos en esta categoría</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          {/* Contenedor con altura máxima y scroll interno */}
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2">{editing? 'Editar Producto':'Nuevo Producto'}</h2>
            <ProductForm
              initialValue={form}
              saving={saving}
              onCancel={()=>setModalOpen(false)}
              onSave={saveProduct}
            />
          </div>
        </div>
      )}
    </div>
  );
}
