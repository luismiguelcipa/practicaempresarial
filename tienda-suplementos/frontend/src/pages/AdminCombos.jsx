import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminCombos() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Normalizar categoría
  const categoryName = category === 'volumen' ? 'Volumen' : 'Definición';

  const emptyCombo = {
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: categoryName,
    image: '',
    inStock: true,
    featured: false,
    products: []
  };

  const [form, setForm] = useState(emptyCombo);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/combos?category=${categoryName}`);
      setCombos(data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Error cargando combos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Validar categoría
    if (category !== 'volumen' && category !== 'definición' && category !== 'definicion') {
      navigate('/admin/products');
      return;
    }
    
    // Solo hacer fetch si está autenticado
    if (isAuthenticated && user?.role === 'admin') {
      fetchCombos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, isAuthenticated, user]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCombo);
    setModalOpen(true);
  };

  const openEdit = (combo) => {
    setEditing(combo);
    setForm({
      name: combo.name || '',
      description: combo.description || '',
      price: combo.price || '',
      originalPrice: combo.originalPrice || '',
      category: combo.category,
      image: combo.image || '',
      inStock: combo.inStock !== false,
      featured: combo.featured || false,
      products: combo.products || []
    });
    setModalOpen(true);
  };

  const saveCombo = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', categoryName);
      formData.append('inStock', form.inStock);
      formData.append('featured', form.featured);
      
      if (form.originalPrice) formData.append('originalPrice', form.originalPrice);
      if (form.products && form.products.length > 0) {
        formData.append('products', JSON.stringify(form.products));
      }
      
      // Si hay una imagen nueva seleccionada
      if (form.imageFile) {
        formData.append('image', form.imageFile);
      }

      if (editing) {
        await axios.put(`/api/combos/${editing._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/combos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setModalOpen(false);
      fetchCombos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error guardando combo');
    } finally {
      setSaving(false);
    }
  };

  const deleteCombo = async (combo) => {
    if (!confirm('¿Eliminar este combo definitivamente?')) return;
    try {
      await axios.delete(`/api/combos/${combo._id}`);
      setCombos(cs => cs.filter(c => c._id !== combo._id));
    } catch (e) {
      alert('Error eliminando: ' + (e.response?.data?.message || 'intenta de nuevo'));
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="pt-24 md:pt-28 p-6 max-w-6xl mx-auto">
        <div className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Acceso restringido. Debes ser administrador para acceder a esta página.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-24 md:pt-28 p-6 max-w-6xl mx-auto">
        <p className="text-sm text-gray-500">Cargando combos...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-28 p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/products')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Panel
          </button>
          <h1 className="text-2xl font-bold">Combos de {categoryName}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {combos.length} combo{combos.length !== 1 ? 's' : ''} en total
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={fetchCombos}
            className="text-xs px-3 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
          >
            Refrescar
          </button>
          
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Combo
          </button>
        </div>
      </header>

      {loading && <p className="text-sm text-gray-500">Cargando combos...</p>}
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}

      {!loading && combos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No hay combos de {categoryName} aún</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Crear Primer Combo
          </button>
        </div>
      )}

      {/* Lista de combos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {combos.map(combo => (
          <div key={combo._id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-gray-100">
              {combo.image && (
                <img
                  src={`${axios.defaults.baseURL}${combo.image}`}
                  alt={combo.name}
                  className="w-full h-full object-cover"
                />
              )}
              {!combo.inStock && (
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                  Sin Stock
                </div>
              )}
              {combo.featured && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Destacado
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{combo.name}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{combo.description}</p>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-bold text-green-600">${combo.price}</span>
                {combo.originalPrice && combo.originalPrice > combo.price && (() => {
                  const pct = Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100);
                  return (
                    <>
                      <span className="text-sm text-gray-400 line-through">${combo.originalPrice}</span>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">-{pct}%</span>
                    </>
                  );
                })()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(combo)}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteCombo(combo)}
                  className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de creación/edición */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">{editing ? 'Editar Combo' : 'Nuevo Combo'}</h2>
            
            <form onSubmit={saveCombo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Original</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={e => setForm({ ...form, originalPrice: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setForm({ ...form, imageFile: e.target.files[0] })}
                  className="w-full px-3 py-2 border rounded"
                />
                {editing && form.image && !form.imageFile && (
                  <p className="text-xs text-gray-500 mt-1">Imagen actual: {form.image.split('/').pop()}</p>
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={e => setForm({ ...form, inStock: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">En Stock</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Destacado</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
