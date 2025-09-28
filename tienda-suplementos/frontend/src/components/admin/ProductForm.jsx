import { useState, useEffect } from 'react';

const categories = ['Proteínas', 'Creatina', 'Aminoácidos', 'Pre-Workout', 'Vitaminas', 'Otros'];

export default function ProductForm({ initialValue, onCancel, onSave, saving }) {
  const [form, setForm] = useState({ ...initialValue, baseSize: initialValue.baseSize || '', variants: initialValue.variants || [], flavors: initialValue.flavors || [] });

  useEffect(() => { setForm({ ...initialValue, baseSize: initialValue.baseSize || '', variants: initialValue.variants || [], flavors: initialValue.flavors || [] }); }, [initialValue]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
        <select value={form.category} onChange={e=>update('category', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium">Imagen (URL)
        <input value={form.image} onChange={e=>update('image', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm" required />
      </label>
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
                  <label className="block text-[10px] font-medium">Imagen (URL)
                    <input value={v.image} onChange={e=>updateVariant(idx,'image', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-[11px]" placeholder="/images/whey-4lb.jpg" />
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