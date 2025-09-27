import { useState, useEffect } from 'react';

const categories = ['Proteínas', 'Creatina', 'Aminoácidos', 'Pre-Workout', 'Vitaminas', 'Otros'];

export default function ProductForm({ initialValue, onCancel, onSave, saving }) {
  const [form, setForm] = useState(initialValue);

  useEffect(() => { setForm(initialValue); }, [initialValue]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, price: Number(form.price), stock: Number(form.stock) });
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="text-xs font-medium">Nombre
        <input value={form.name} onChange={e=>update('name', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm" required />
      </label>
      <label className="text-xs font-medium">Precio
        <input type="number" min="0" step="0.01" value={form.price} onChange={e=>update('price', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm" required />
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
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" disabled={saving} onClick={onCancel} className="px-3 py-1 text-sm border rounded">Cancelar</button>
        <button type="submit" disabled={saving} className="px-4 py-1 text-sm bg-indigo-600 text-white rounded disabled:opacity-50">{saving? 'Guardando...':'Guardar'}</button>
      </div>
    </form>
  );
}