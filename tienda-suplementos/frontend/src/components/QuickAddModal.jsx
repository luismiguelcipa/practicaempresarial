import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../context/CartContext';

// Props: product (obj), open (bool), onClose()
export default function QuickAddModal({ product, open, onClose }) {
  const { addToCart, openCart } = useCart();
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Recalcular opciones cuando cambia producto
  const sizeOptions = useMemo(() => {
    if (!product) return [];
    const opts = [];
    if (product.baseSize) {
      opts.push({ _id: 'BASE', size: product.baseSize, price: product.price, image: product.image, stock: product.stock, __isBase: true });
    }
    if (Array.isArray(product.variants)) {
      product.variants.forEach(v => { if (v && v.size) opts.push(v); });
    }
    return opts;
  }, [product]);

  const flavors = useMemo(() => Array.isArray(product?.flavors) ? product.flavors : [], [product]);

  useEffect(() => {
    if (open && product) {
      setSelectedSizeId(sizeOptions.length ? String(sizeOptions[0]._id) : null);
      setSelectedFlavor(flavors.length ? flavors[0] : null);
      setQuantity(1);
    }
  }, [open, product, sizeOptions, flavors]);

  const selectedSize = useMemo(() => {
    if (!sizeOptions.length) return null;
    if (selectedSizeId === 'BASE') return sizeOptions.find(o => o._id === 'BASE');
    return sizeOptions.find(o => String(o._id) === String(selectedSizeId)) || sizeOptions[0];
  }, [sizeOptions, selectedSizeId]);

  const displayPrice = selectedSize ? selectedSize.price : product?.price;
  const displayImage = selectedSize && selectedSize.image ? selectedSize.image : product?.image;
  const displayStock = selectedSize && typeof selectedSize.stock === 'number' ? selectedSize.stock : product?.stock;

  const canAdd = product && product.isActive !== false && (displayStock === undefined || displayStock > 0);

  const adjustQty = (d) => {
    setQuantity(q => {
      let next = q + d;
      if (next < 1) next = 1;
      if (displayStock !== undefined && displayStock !== null && next > displayStock) next = displayStock;
      return next;
    });
  };

  const handleAdd = () => {
    if (!canAdd) return;
    addToCart({
      ...product,
      price: displayPrice,
      image: displayImage,
      variantId: selectedSize && !selectedSize.__isBase ? selectedSize._id : null,
      size: selectedSize ? selectedSize.size : (product.baseSize || null),
      flavor: selectedFlavor,
      quantity
    });
    onClose?.();
    openCart();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden animate-slide-up">
        <div className="flex items-start gap-4 p-6">
          <div className="w-32 h-32 flex-shrink-0 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            {displayImage && <img src={displayImage} alt={product?.name} className="object-contain w-full h-full" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">{product?.name}</h2>
            <p className="text-xs text-gray-500 mt-1 line-clamp-3">{product?.description}</p>
            <div className="mt-3 text-2xl font-bold text-gray-900">${displayPrice}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition" aria-label="Cerrar">✕</button>
        </div>

        <div className="px-6 pb-5 space-y-5 overflow-y-auto">
          {sizeOptions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-600 mb-2 tracking-wide">TAMAÑO</p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map(o => {
                  const active = (o._id === 'BASE' && selectedSizeId === 'BASE') || String(o._id) === String(selectedSizeId);
                  const disabled = typeof o.stock === 'number' && o.stock <= 0;
                  return (
                    <button
                      key={o._id}
                      disabled={disabled}
                      onClick={() => setSelectedSizeId(o._id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {o.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {flavors.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-600 mb-2 tracking-wide">SABOR</p>
              <div className="flex flex-wrap gap-2">
                {flavors.map(f => {
                  const active = f === selectedFlavor;
                  return (
                    <button
                      key={f}
                      onClick={() => setSelectedFlavor(f)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center border rounded-full overflow-hidden">
              <button onClick={() => adjustQty(-1)} className="w-9 h-9 flex items-center justify-center text-lg font-medium hover:bg-gray-100" aria-label="Disminuir">−</button>
              <div className="w-10 text-center font-semibold text-sm">{quantity}</div>
              <button onClick={() => adjustQty(1)} className="w-9 h-9 flex items-center justify-center text-lg font-medium hover:bg-gray-100" aria-label="Aumentar">+</button>
            </div>
            {displayStock !== undefined && <p className="text-[11px] text-gray-500">Stock: {displayStock}</p>}
          </div>
        </div>

        <div className="p-6 pt-2 border-t bg-gray-50 flex gap-4">
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className={`flex-1 h-12 rounded-full text-sm font-semibold tracking-wide transition shadow ${canAdd ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
              Agregar al carrito
            </button>
            <button
              onClick={onClose}
              className="h-12 px-6 rounded-full text-sm font-semibold tracking-wide border border-gray-300 hover:bg-white text-gray-700"
            >Cerrar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
