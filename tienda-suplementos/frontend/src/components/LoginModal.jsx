import { useEffect } from 'react';
import { useUI } from '../context/UIContext';
import Login from '../pages/Login'; // ahora: Registro (email + código)
import LoginSimple from '../pages/LoginSimple'; // login directo
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginModal() {
  const { isLoginOpen, openLogin, closeLogin } = useUI();
  const location = useLocation();
  const navigate = useNavigate();

  // Cerrar con Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeLogin();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeLogin]);

  // Bloquear scroll cuando modal abierto
  useEffect(() => {
    if (isLoginOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previous; };
    }
  }, [isLoginOpen]);

  useEffect(() => {
    // Abrir modal cuando ruta sea /login (login simple) o /sign-in (registro)
    if (location.pathname === '/login' || location.pathname === '/sign-in') {
      openLogin();
    } else if (isLoginOpen) {
      // Salimos de rutas de auth -> cerrar
      closeLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Solo renderizar si modal está abierto y estamos en una ruta válida
  if (!isLoginOpen || (location.pathname !== '/login' && location.pathname !== '/sign-in')) return null;

  return (
  <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => { closeLogin(); navigate('/'); }}
      />

      {/* Contenedor centrado */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onMouseDown={(e) => {
          // Si el click comienza exactamente en este contenedor (no en el panel interno) cerramos
          if (e.target === e.currentTarget) {
            closeLogin();
            navigate('/');
          }
        }}
      >
        {/* Contenido del modal */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          {/* Botón cerrar */}
          <button
            onClick={() => { closeLogin(); navigate('/'); }}
            className="absolute -right-3 -top-3 z-[101] rounded-full bg-white text-black w-8 h-8 shadow-md hover:bg-gray-100"
            aria-label="Cerrar"
            title="Cerrar"
          >
            X
          </button>
          {location.pathname === '/login' && <LoginSimple />}
          {location.pathname === '/sign-in' && <Login />}
        </div>
      </div>
    </div>
  );
}
