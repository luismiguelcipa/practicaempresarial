import { useState, useEffect } from 'react';
import { uploadImage } from '../../services/api';

// Categorías originales (rollback a estado estable previo a la expansión)
const categories = ['Proteínas','Creatina','Aminoácidos','Pre-Workout','Vitaminas','Otros'];

// editingMode: boolean indica si estamos editando un producto existente.
export default function ProductForm({ initialValue, onCancel, onSave, saving, editingMode }) {
  const [form, setForm] = useState({ 
    ...initialValue, 
    baseSize: initialValue.baseSize || '', 
    tipo: initialValue.tipo || '',
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
      stock: Number(form.stock),
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
    <form onSubmit={submit} className="grid gap-3">
      <label className="text-xs font-medium">Nombre
        <input value={form.name} onChange={e=>update('name', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm" required />
      </label>
      <label className="text-xs font-medium">Precio
        <input type="number" min="0" step="0.01" value={form.price} onChange={e=>update('price', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm" required />
      </label>
      <label className="text-xs font-medium">Tamaño base (obligatorio)
        <input value={form.baseSize} onChange={e=>update('baseSize', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm" placeholder="Ej: 4 libras / 400g / 30 serv" required />
      </label>
      <label className="text-xs font-medium">Categoría
        {editingMode ? (
          <select value={form.category} onChange={e=>update('category', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        ) : (
          <input
            value={form.category}
            readOnly
            className="mt-1 w-full border rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
            title="Categoría preseleccionada según el panel"
          />
        )}
      </label>
      
      {/* Campo Tipo - Solo para Proteínas y Creatina */}
      {(form.category === 'Proteínas' || form.category === 'Creatina') && (
        <label className="text-xs font-medium">Tipo
          <select 
            value={form.tipo || ''} 
            onChange={e=>update('tipo', e.target.value)} 
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
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

      <div className="space-y-2">
        <label className="text-xs font-medium">Imagen
          <div className="mt-1 space-y-2">
            <input 
              value={form.image} 
              onChange={e=>update('image', e.target.value)} 
              className="w-full border rounded px-2 py-1 text-sm" 
              placeholder="URL de la imagen"
              required 
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">o</span>
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
                  className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? 'Subiendo...' : '📁 Elegir archivo'}
                </label>
              </label>
            </div>
            {imageError && (
              <p className="text-xs text-red-600">{imageError}</p>
            )}
            {form.image && (
              <div className="mt-2">
                <img 
                  src={form.image} 
                  alt="Preview" 
                  className="h-20 w-20 object-cover rounded border"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        </label>
      </div>
      <label className="text-xs font-medium">Stock
        <input type="number" min="0" value={form.stock} onChange={e=>update('stock', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm" required />
      </label>
      <label className="flex items-center gap-2 text-xs font-medium">
        <input type="checkbox" checked={form.isActive} onChange={e=>update('isActive', e.target.checked)} /> Activo
      </label>
      <label className="text-xs font-medium">Descripción
        <textarea value={form.description} onChange={e=>update('description', e.target.value)} rows={3} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>

      {/* Variantes */}
      <div className="border rounded p-3 bg-gray-50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Variantes (tamaños) opcionales</span>
          <button type="button" onClick={addVariant} className="text-[10px] px-2 py-1 rounded bg-indigo-600 text-white">Añadir</button>
        </div>
        {form.variants.length === 0 && (
          <p className="text-[11px] text-gray-500">Si agregas más de una variante, el cliente verá selector de tamaño y se usará el precio de la variante.</p>
        )}
        {form.variants.length > 0 && (
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {form.variants.map((v,idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 items-end bg-white p-2 rounded border">
                <div className="col-span-1">
                  <label className="block text-[10px] font-medium">Tamaño
                    <input value={v.size} onChange={e=>updateVariant(idx,'size', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-[11px]" placeholder="4 libras" />
                  </label>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-medium">Precio
                    <input type="number" min="0" step="0.01" value={v.price} onChange={e=>updateVariant(idx,'price', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-[11px]" />
                  </label>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-medium">Stock
                    <input type="number" min="0" value={v.stock} onChange={e=>updateVariant(idx,'stock', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-[11px]" />
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium">Imagen
                    <div className="space-y-1">
                      <input 
                        value={v.image} 
                        onChange={e=>updateVariant(idx,'image', e.target.value)} 
                        className="mt-1 w-full border rounded px-2 py-1 text-[11px]" 
                        placeholder="URL de la imagen" 
                      />
                      <div className="flex items-center gap-1">
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
                          className="cursor-pointer inline-flex items-center px-2 py-1 border border-gray-300 rounded text-[10px] bg-white hover:bg-gray-50"
                        >
                          {uploadingVariantImage === idx ? '⏳' : '📁'}
                        </label>
                        {v.image && (
                          <img 
                            src={v.image} 
                            alt="Preview" 
                            className="h-8 w-8 object-cover rounded border"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      {variantImageError[idx] && (
                        <p className="text-[9px] text-red-600">{variantImageError[idx]}</p>
                      )}
                    </div>
                  </label>
                </div>
                <button type="button" onClick={()=>removeVariant(idx)} className="text-red-600 text-[10px] hover:underline mt-4">Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sabores */}
      <div className="border rounded p-3 bg-gray-50 space-y-2">
        <span className="text-xs font-semibold">Sabores opcionales</span>
        <div className="flex gap-2">
          <input value={flavorInput} onChange={e=>setFlavorInput(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Ej: Vainilla" />
          <button type="button" onClick={()=>{ addFlavor(flavorInput); setFlavorInput(''); }} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded">Añadir</button>
        </div>
        {form.flavors.length === 0 && <p className="text-[11px] text-gray-500">Si agregas más de un sabor se mostrará un selector de sabores.</p>}
        {form.flavors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.flavors.map(f => (
              <span key={f} className="inline-flex items-center gap-1 bg-white border rounded px-2 py-0.5 text-[11px]">
                {f}
                <button type="button" onClick={()=>removeFlavor(f)} className="text-red-500 hover:text-red-700">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" disabled={saving} onClick={onCancel} className="px-3 py-1 text-sm border rounded">Cancelar</button>
        <button type="submit" disabled={saving} className="px-4 py-1 text-sm bg-indigo-600 text-white rounded disabled:opacity-50">{saving? 'Guardando...':'Guardar'}</button>
      </div>
    </form>
  );
}