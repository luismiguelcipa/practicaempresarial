import { useState, useEffect } from 'react';
import { uploadImage } from '../../services/api';

// Categorías que coinciden con el navbar (8 categorías principales)
const categories = ['Proteínas','Creatina','Aminoácidos','Pre-Workout','Vitaminas','Para la salud','Complementos','Comida'];

// editingMode: boolean indica si estamos editando un producto existente.
// categoryLocked: boolean indica si la categoría está pre-seleccionada y no debe ser editable (desde panel de categoría/subcategoría)
export default function ProductForm({ initialValue, onCancel, onSave, saving, editingMode, categoryLocked = false }) {
  const [form, setForm] = useState({ 
    ...initialValue, 
    baseSize: initialValue.baseSize || '', 
    tipo: initialValue.tipo || '',
    inStock: initialValue.inStock !== false,
    variants: initialValue.variants || [], 
    flavors: initialValue.flavors || [] 
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [uploadingVariantImage, setUploadingVariantImage] = useState(null);
  const [variantImageError, setVariantImageError] = useState({});

  useEffect(() => { 
    setForm({ 
      ...initialValue, 
      baseSize: initialValue.baseSize || '', 
      tipo: initialValue.tipo || '',
      inStock: initialValue.inStock !== false,
      variants: initialValue.variants || [], 
      flavors: initialValue.flavors || [] 
    }); 
  }, [initialValue]);

  const update = (k, v) => {
    // Si se cambia la categoría, limpiar el tipo si no aplica
    if (k === 'category') {
      if (v !== 'Proteínas' && v !== 'Creatina') {
        setForm(f => ({ ...f, [k]: v, tipo: '' }));
        return;
      }
    }
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('La imagen no debe superar los 5MB');
      return;
    }

    setImageError('');
    setUploadingImage(true);

    try {
      const result = await uploadImage(file);
      if (result.success && result.imageUrl) {
        // Agregar el dominio del servidor al URL de la imagen
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const fullImageUrl = `${API_URL.replace('/api', '')}${result.imageUrl}`;
        update('image', fullImageUrl);
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setImageError(error.response?.data?.message || 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVariantImageUpload = async (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setVariantImageError({ ...variantImageError, [idx]: 'Solo se permiten imágenes (jpeg, jpg, png, gif, webp)' });
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setVariantImageError({ ...variantImageError, [idx]: 'La imagen no debe superar los 5MB' });
      return;
    }

    setVariantImageError({ ...variantImageError, [idx]: '' });
    setUploadingVariantImage(idx);

    try {
      const result = await uploadImage(file);
      if (result.success && result.imageUrl) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const fullImageUrl = `${API_URL.replace('/api', '')}${result.imageUrl}`;
        updateVariant(idx, 'image', fullImageUrl);
      }
    } catch (error) {
      console.error('Error al subir imagen de variante:', error);
      setVariantImageError({ ...variantImageError, [idx]: error.response?.data?.message || 'Error al subir la imagen' });
    } finally {
      setUploadingVariantImage(null);
    }
  };

  const addVariant = () => {
    setForm(f => ({ ...f, variants: [...f.variants, { size:'', price:0, image:'', stock:0 }] }));
  };

  const updateVariant = (idx, key, value) => {
    setForm(f => ({ ...f, variants: f.variants.map((v,i)=> i===idx ? { ...v, [key]: value } : v ) }));
  };

  const removeVariant = (idx) => {
    setForm(f => ({ ...f, variants: f.variants.filter((_,i)=> i!==idx ) }));
  };

  const addFlavor = (flavor) => {
    const val = flavor.trim();
    if (!val) return;
    setForm(f => ({ ...f, flavors: f.flavors.includes(val) ? f.flavors : [...f.flavors, val] }));
  };

  const removeFlavor = (flavor) => {
    setForm(f => ({ ...f, flavors: f.flavors.filter(fl => fl !== flavor) }));
  };

  const [flavorInput, setFlavorInput] = useState('');

  const submit = (e) => {
    e.preventDefault();
    // Limpieza de variantes vacías
    const cleanVariants = (form.variants || []).filter(v => v.size.trim() && v.price >= 0);
    const payload = {
      ...form,
      price: Number(form.price),
      inStock: form.inStock !== false,
      variants: cleanVariants.map(v => ({
        ...v,
        price: Number(v.price),
        stock: Number(v.stock)
      })),
      flavors: (form.flavors || []).filter(f => f.trim())
    };
    
    // Limpiar tipo si no aplica a la categoría
    if (form.category !== 'Proteínas' && form.category !== 'Creatina') {
      delete payload.tipo;
    }
    
    onSave(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Información Básica */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Información Básica
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700 mb-1 block">Nombre del Producto *</span>
            <input 
              value={form.name} 
              onChange={e=>update('name', e.target.value)} 
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all" 
              placeholder="Ej: Whey Protein Premium"
              required 
            />
          </label>
          
          <label className="block">
            <span className="text-xs font-semibold text-gray-700 mb-1 block">Precio *</span>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 font-bold">$</span>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={form.price} 
                onChange={e=>update('price', e.target.value)} 
                className="w-full pl-7 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all" 
                placeholder="0.00"
                required 
              />
            </div>
          </label>
        </div>

        {/* Precio Original opcional para mostrar descuento */}
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700 mb-1 block">Precio Original (opcional)</span>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 font-bold">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.originalPrice || ''}
                onChange={e=>update('originalPrice', e.target.value)}
                className="w-full pl-7 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                placeholder="Precio anterior para mostrar descuento"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Si estableces un precio original mayor que el actual, se mostrará el descuento automáticamente.</p>
          </label>
        </div>
        
        <label className="block">
          <span className="text-xs font-semibold text-gray-700 mb-1 block">Tamaño Base *</span>
          <input 
            value={form.baseSize} 
            onChange={e=>update('baseSize', e.target.value)} 
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all" 
            placeholder="Ej: 4 libras / 400g / 30 servings"
            required 
          />
        </label>
      </div>

      {/* Categoría y Tipo */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Clasificación
        </h3>
        
        <label className="block">
          <span className="text-xs font-semibold text-gray-700 mb-1 block">Categoría *</span>
          {editingMode ? (
            <select 
              value={form.category} 
              onChange={e=>update('category', e.target.value)} 
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all bg-white"
            >
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          ) : categoryLocked ? (
            <input
              value={form.category}
              readOnly
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
              title="Categoría preseleccionada según el panel"
            />
          ) : (
            <select 
              value={form.category} 
              onChange={e=>update('category', e.target.value)} 
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all bg-white" 
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          )}
        </label>
        
        {/* Campo Tipo - Solo para Proteínas y Creatina */}
        {(form.category === 'Proteínas' || form.category === 'Creatina') && (
          <label className="block">
            <span className="text-xs font-semibold text-gray-700 mb-1 block">Tipo/Subcategoría *</span>
            <select 
              value={form.tipo || ''} 
              onChange={e=>update('tipo', e.target.value)} 
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all bg-white"
              required
            >
              <option value="">Selecciona un tipo</option>
              {form.category === 'Proteínas' && (
                <>
                  <option value="Limpia">Limpia</option>
                  <option value="Hipercalórica">Hipercalórica</option>
                  <option value="Vegana">Vegana</option>
                </>
              )}
              {form.category === 'Creatina' && (
                <>
                  <option value="Monohidrato">Monohidrato</option>
                  <option value="HCL">HCL</option>
                </>
              )}
            </select>
          </label>
        )}
      </div>

      {/* Imagen */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-orange-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Imagen del Producto
        </h3>
        
        <div className="space-y-3">
          <input 
            value={form.image} 
            onChange={e=>update('image', e.target.value)} 
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all" 
            placeholder="URL de la imagen"
            required 
          />
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">o subir archivo:</span>
            <label className="flex-1">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="imageUpload"
                disabled={uploadingImage}
              />
              <label 
                htmlFor="imageUpload" 
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-300 rounded-lg text-sm font-medium bg-white hover:bg-orange-50 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {uploadingImage ? 'Subiendo...' : 'Elegir archivo'}
              </label>
            </label>
          </div>
          
          {imageError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {imageError}
            </div>
          )}
          
          {form.image && (
            <div className="flex justify-center">
              <img 
                src={form.image} 
                alt="Preview" 
                className="h-32 w-32 object-cover rounded-lg border-4 border-white shadow-lg"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Disponibilidad y Estado */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Estado del Producto
        </h3>
        
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-red-400 transition-all">
            <input 
              type="checkbox" 
              checked={form.inStock !== false} 
              onChange={e=>update('inStock', e.target.checked)} 
              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-800">Hay stock disponible</span>
              <p className="text-xs text-gray-500">El producto está disponible para la venta</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${form.inStock !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {form.inStock !== false ? '✓ Disponible' : '✗ Agotado'}
            </span>
          </label>
          
          <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-red-400 transition-all">
            <input 
              type="checkbox" 
              checked={form.isActive} 
              onChange={e=>update('isActive', e.target.checked)} 
              className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-800">Producto activo</span>
              <p className="text-xs text-gray-500">Visible en la tienda</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${form.isActive ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              {form.isActive ? '👁️ Visible' : '🔒 Oculto'}
            </span>
          </label>
        </div>
      </div>

      {/* Descripción */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-pink-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Descripción
        </h3>
        <textarea 
          value={form.description} 
          onChange={e=>update('description', e.target.value)} 
          rows={4} 
          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all resize-none"
          placeholder="Describe el producto, sus beneficios, ingredientes, modo de uso, etc."
        />
      </div>

      {/* Variantes */}
      <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Variantes (Tamaños)
            <span className="text-xs font-normal text-gray-500">Opcional</span>
          </h3>
          <button 
            type="button" 
            onClick={addVariant} 
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-sm hover:shadow flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Añadir
          </button>
        </div>
        
        {form.variants.length === 0 && (
          <p className="text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border border-dashed border-gray-300">
            💡 Si agregas más de una variante, el cliente verá un selector de tamaño y se usará el precio de la variante.
          </p>
        )}
        
        {form.variants.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-auto pr-1">
            {form.variants.map((v,idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border-2 border-gray-200 space-y-3 hover:border-red-300 transition-all">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-700 mb-1 block">Tamaño</span>
                    <input 
                      value={v.size} 
                      onChange={e=>updateVariant(idx,'size', e.target.value)} 
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all" 
                      placeholder="Ej: 4 libras" 
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-700 mb-1 block">Precio</span>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">$</span>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={v.price} 
                        onChange={e=>updateVariant(idx,'price', e.target.value)} 
                        className="w-full pl-7 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all" 
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-700 mb-1 block">Stock</span>
                    <input 
                      type="number" 
                      min="0" 
                      value={v.stock} 
                      onChange={e=>updateVariant(idx,'stock', e.target.value)} 
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all" 
                    />
                  </label>
                </div>
                
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-700 block">Imagen de la variante</span>
                  <input 
                    value={v.image} 
                    onChange={e=>updateVariant(idx,'image', e.target.value)} 
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all" 
                    placeholder="URL de la imagen" 
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleVariantImageUpload(idx, e)}
                      className="hidden"
                      id={`variantImageUpload-${idx}`}
                      disabled={uploadingVariantImage === idx}
                    />
                    <label 
                      htmlFor={`variantImageUpload-${idx}`}
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border-2 border-red-300 rounded-lg text-xs font-medium bg-white hover:bg-red-50 transition-all"
                    >
                      {uploadingVariantImage === idx ? '⏳ Subiendo...' : '📁 Subir'}
                    </label>
                    {v.image && (
                      <img 
                        src={v.image} 
                        alt="Preview" 
                        className="h-12 w-12 object-cover rounded-lg border-2 border-white shadow"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  {variantImageError[idx] && (
                    <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{variantImageError[idx]}</p>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={()=>removeVariant(idx)} 
                    className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sabores */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Sabores
          <span className="text-xs font-normal text-gray-500">Opcional</span>
        </h3>
        
        <div className="flex gap-2">
          <input 
            value={flavorInput} 
            onChange={e=>setFlavorInput(e.target.value)} 
            className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all" 
            placeholder="Ej: Vainilla, Chocolate, Fresa..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (flavorInput.trim()) {
                  addFlavor(flavorInput);
                  setFlavorInput('');
                }
              }
            }}
          />
          <button 
            type="button" 
            onClick={()=>{ 
              if (flavorInput.trim()) {
                addFlavor(flavorInput); 
                setFlavorInput(''); 
              }
            }} 
            className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Añadir
          </button>
        </div>
        
        {form.flavors.length === 0 && (
          <p className="text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border border-dashed border-gray-300">
            💡 Si agregas más de un sabor, se mostrará un selector de sabores al cliente.
          </p>
        )}
        
        {form.flavors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.flavors.map(f => (
              <span key={f} className="inline-flex items-center gap-2 bg-white border-2 border-rose-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-rose-400 transition-all">
                {f}
                <button 
                  type="button" 
                  onClick={()=>removeFlavor(f)} 
                  className="text-rose-600 hover:text-rose-800 font-bold text-lg leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
        <button 
          type="button" 
          disabled={saving} 
          onClick={onCancel} 
          className="px-6 py-2.5 text-sm font-semibold border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={saving} 
          className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Guardar Producto
            </>
          )}
        </button>
      </div>
    </form>
  );
}
