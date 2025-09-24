import React, { useRef, useEffect, useMemo } from 'react';

// Mensajes base del carrusel
const ITEMS = [
  { id: 'envio', text: 'Tu envío es gratis desde $0', icon: 'truck', color: 'text-blue-200' },
  { id: 'ahorro', text: 'Compra más, ahorra más', icon: 'bag', color: 'text-green-200' },
  { id: 'combos', text: 'Combos imperdibles HOY', icon: 'lock', color: 'text-yellow-200' }
];

const Icon = ({ name, className }) => {
  switch (name) {
    case 'truck':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V5a1 1 0 011-1h5a1 1 0 011 1v12m-7 0h7m-7 0a2 2 0 11-4 0m11 0a2 2 0 11-4 0"/></svg>;
    case 'bag':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" strokeWidth="2"/><path d="M2 11h20" strokeWidth="2"/></svg>;
    case 'lock':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2"/></svg>;
    default:
      return null;
  }
};

// Carrusel infinito controlado por JS para evitar depender de ancho exacto en CSS.
const TextCarrousel = ({ speed = 40, offset = 0 }) => {
  // speed = pixeles por segundo
  const trackRef = useRef(null);
  const reqRef = useRef(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);

  const duplicated = useMemo(() => [...ITEMS, ...ITEMS], []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Calcular mitad del ancho (porque duplicamos el contenido)
    const computeHalf = () => {
      // Al duplicar ITEMS una vez, la mitad exacta es scrollWidth / 2 (incluye gaps y paddings)
      halfWidthRef.current = track.scrollWidth / 2;
    };
    computeHalf();
    window.addEventListener('resize', computeHalf);

    let lastTs = performance.now();
    const step = (ts) => {
      const dt = (ts - lastTs) / 1000; // segundos
      lastTs = ts;
      // avanzar según velocidad
      offsetRef.current += speed * dt;
      if (offsetRef.current >= halfWidthRef.current) {
        offsetRef.current -= halfWidthRef.current; // reciclar
      }
      track.style.transform = `translateX(-${offsetRef.current}px)`;
      reqRef.current = requestAnimationFrame(step);
    };
    reqRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener('resize', computeHalf);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [speed]);

  return (
    <section
      id="carrusel-superior"
      className="w-full overflow-hidden select-none"
      style={{
        backgroundColor: 'rgb(111, 32, 32)',
        borderBottom: '2px solid rgb(111, 32, 32)',
        // Elimina gran espacio superior; permite ajuste opcional vía prop
        marginTop: offset
      }}
    >
      <div className="flex items-center h-9">
        <div className="w-full overflow-hidden relative">
          <ul
            ref={trackRef}
            className="flex gap-10 whitespace-nowrap will-change-transform"
            style={{ paddingLeft: '1rem' }}
          >
            {duplicated.map((item, idx) => (
              <li key={item.id + '-' + idx} className="flex items-center gap-2">
                <Icon name={item.icon} className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs text-gray-300 font-bold">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default TextCarrousel;
