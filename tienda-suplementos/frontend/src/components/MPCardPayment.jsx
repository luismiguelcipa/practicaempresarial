import { useEffect, useRef, useState } from 'react';

// Renderiza el Brick de Card Payment (Checkout API)
// Requiere VITE_MERCADOPAGO_PUBLIC_KEY (TEST o PROD)
// processPayment(cardFormData) debe devolver una Promise; si lanza error el Brick lo mostrará.
export default function MPCardPayment({ amount, processPayment, onError, onFallback }) {
  const containerRef = useRef(null);
  const brickControllerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [offerFallback, setOfferFallback] = useState(false);

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    if (!publicKey) {
      onError?.(new Error('Falta VITE_MERCADOPAGO_PUBLIC_KEY'));
      return;
    }

    // Cargar SDK si no existe
    async function ensureSdk() {
  if (window.MercadoPago) return;
      await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
        if (existing) {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK de Mercado Pago')),{ once: true });
          return;
        }
        const s = document.createElement('script');
        s.src = 'https://sdk.mercadopago.com/js/v2';
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error('No se pudo cargar el SDK de Mercado Pago'));
        document.body.appendChild(s);
      });
    }

    async function createBrick() {
      try {
        await ensureSdk();
        // global MercadoPago del script sdk v2
        const mp = new window.MercadoPago(publicKey, { locale: 'es-CO' });
        const bricksBuilder = mp.bricks();
        const settings = {
          initialization: {
            amount: Number(amount) || 1,
          },
          callbacks: {
            onReady: () => setLoading(false),
            onSubmit: async (cardFormData) => {
              if (!processPayment) return;
              return await processPayment(cardFormData);
            },
            onError: (error) => {
              console.error('Brick error', error);
              onError?.(error);
            }
          },
          customization: {
            visual: {
              style: { theme: 'default' }
            }
          }
        };

        const controller = await bricksBuilder.create('cardPayment', 'mp-card-payment-container', settings);
        brickControllerRef.current = controller;
        // si cargó, cancelar fallback
        setOfferFallback(false);
      } catch (e) {
        setErrorMsg(e?.message || 'No se pudo inicializar el formulario de pago');
        onError?.(e);
        setOfferFallback(true);
      }
    }

    // crear contenedor si no existe
    if (containerRef.current && !document.getElementById('mp-card-payment-container')) {
      const div = document.createElement('div');
      div.id = 'mp-card-payment-container';
      containerRef.current.appendChild(div);
    }

    // Disparar timeout de fallback por si el SDK no responde
    const t = setTimeout(() => {
      if (loading) setOfferFallback(true);
    }, 6000);

    createBrick();

    return () => {
      if (brickControllerRef.current) brickControllerRef.current.unmount();
      clearTimeout(t);
    };
  }, [amount]);

  return (
    <div>
      <div ref={containerRef} />
      {loading && !errorMsg && <p>Cargando formulario de tarjeta…</p>}
      {errorMsg && (
        <div className="p-3 mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}
      {offerFallback && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onFallback?.()}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700"
          >
            Usar método alternativo
          </button>
          <p className="text-xs text-gray-500 mt-1">Si el formulario no carga, puedes pagar abriendo la ventana de Mercado Pago.</p>
        </div>
      )}
    </div>
  );
}
