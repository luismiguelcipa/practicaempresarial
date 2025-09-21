import { useEffect } from 'react';
import { useUI } from '../context/UIContext';
import Login from '../pages/Login';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginModal() {
  const { isLoginOpen, openLogin, closeLogin } = useUI();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeLogin();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeLogin]);

  useEffect(() => {
    // Bloquea el scroll del body mientras el modal está abierto
    if (isLoginOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previous; };
    }
  }, [isLoginOpen]);

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
        onClick={() => { closeLogin(); navigate('/'); }}
      />

      {/* Contenedor centrado */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* Contenido del modal: reutiliza el componente Login (que ya renderiza una tarjeta blanca) */}
        <div className="relative">
          {/* Botón cerrar */}
          <button
            onClick={() => { closeLogin(); navigate('/'); }}
            className="absolute -right-3 -top-3 z-[101] rounded-full bg-white text-black w-8 h-8 shadow-md hover:bg-gray-100"
            aria-label="Cerrar"
            title="Cerrar"
          >
            X
          </button>
          <Login />
        </div>
      </div>
    </div>
  );
}
