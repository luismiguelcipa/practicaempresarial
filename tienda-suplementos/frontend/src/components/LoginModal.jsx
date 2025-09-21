import { useEffect } from 'react';
import { useUI } from '../context/UIContext';
import Login from '../pages/Login';
import { useLocation } from 'react-router-dom';

export default function LoginModal() {
  const { isLoginOpen, openLogin, closeLogin } = useUI();
  const location = useLocation();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeLogin();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeLogin]);

  useEffect(() => {
    // Abrir modal cuando ruta sea /login, cerrarlo si cambia a otra
    if (location.pathname === '/login') {
      openLogin();
    } else if (isLoginOpen) {
      closeLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!isLoginOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeLogin}
      />

      {/* Contenedor centrado */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* Contenido del modal: reutiliza el componente Login (que ya renderiza una tarjeta blanca) */}
        <div className="relative">
          {/* Botón cerrar */}
          <button
            onClick={closeLogin}
            className="absolute -right-3 -top-3 z-[101] rounded-full bg-white text-black w-8 h-8 shadow-md hover:bg-gray-100"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ×
          </button>
          <Login />
        </div>
      </div>
    </div>
  );
}
