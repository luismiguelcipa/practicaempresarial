import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import ProductForm from '../components/admin/ProductForm';

// Página simple de administración de productos
export default function AdminProducts() {
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // producto en edición
  const [saving, setSaving] = useState(false);
  const emptyProduct = { name:'', description:'', price:'', category:'Proteínas', image:'', stock:0, isActive:true };
  const [form, setForm] = useState(emptyProduct);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/products?includeInactive=true&limit=100');
      setProducts(data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyProduct); setModalOpen(true); };

  const openEdit = (p) => { setEditing(p); setForm({ name:p.name||'', description:p.description||'', price:p.price??'', category:p.category||'Proteínas', image:p.image||'', stock:p.stock??0, isActive:p.isActive }); setModalOpen(true); };

  const saveProduct = async (payload) => { setSaving(true); setError(null); try { if (editing) { await axios.put(`/api/products/${editing._id}`, payload); } else { await axios.post('/api/products', payload); } setModalOpen(false); await fetchProducts(); } catch (e) { setError(e.response?.data?.message || 'Error guardando'); } finally { setSaving(false); } };

  const toggleActive = async (p) => {
    try {
      await axios.put(`/api/products/${p._id}`, { isActive: !p.isActive });
      setProducts(ps => ps.map(x => x._id === p._id ? { ...x, isActive: !p.isActive } : x));
    } catch {
      alert('Error cambiando estado');
    }
  };

  const softDelete = async (p) => {
    if (!confirm('Desactivar este producto?')) return;
    try {
      await axios.delete(`/api/products/${p._id}`);
      setProducts(ps => ps.map(x => x._id === p._id ? { ...x, isActive: false } : x));
    } catch {
      alert('Error desactivando');
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return <div className="p-8 text-center text-sm text-red-600">Acceso restringido.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administrar Productos</h1>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">Nuevo</button>
      </header>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}
      {loading ? <p className="text-sm text-gray-500">Cargando...</p> : (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Nombre</th>
                <th className="p-2">Categoría</th>
                <th className="p-2">Precio</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Activo</th>
                <th className="p-2 w-48">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} className={p.isActive ? '' : 'opacity-50'}>
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2">{p.category}</td>
                  <td className="p-2">${p.price}</td>
                  <td className="p-2">{p.stock}</td>
                  <td className="p-2">{p.isActive? 'Sí':'No'}</td>
                  <td className="p-2 flex gap-2 flex-wrap">
                    <button onClick={() => openEdit(p)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Editar</button>
                    <button onClick={() => toggleActive(p)} className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">{p.isActive? 'Desactivar':'Activar'}</button>
                    {p.isActive && <button onClick={() => softDelete(p)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Soft Delete</button>}
                  </td>
                </tr>
              ))}
              {products.length === 0 && !loading && (
                <tr><td colSpan="6" className="p-4 text-center text-gray-500">Sin productos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4 relative">
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
