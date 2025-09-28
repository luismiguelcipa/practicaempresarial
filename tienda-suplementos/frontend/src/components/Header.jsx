import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import logoImg from '../assets/images/Captura_de_pantalla_2025-08-09_192459-removebg-preview.png';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';

// Navbar convertido desde HTML + Tailwind a React, preservando IDs y comportamiento de scroll.
const Header = () => {
  const navbarRef = useRef(null);
  const [solidBg, setSolidBg] = useState(false); // control solo para clases; script original manipulaba directamente
  const { openCart } = useCart();
  const { openSearch } = useUI();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleUserClick = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.getElementById('main-navbar');
      const catalogDropdown = document.getElementById('catalog-dropdown');
      const accessoriesDropdown = document.getElementById('accesorios-dropdown');
      const nosotrosDropdown = document.getElementById('nosotros-dropdown');

      const catalogContent = catalogDropdown ? catalogDropdown.querySelector('.catalog-content') : null;
      const accessoriesContent = accessoriesDropdown ? accessoriesDropdown.querySelector('div') : null;
      const nosotrosContent = nosotrosDropdown ? nosotrosDropdown.querySelector('div') : null;

      const y = window.scrollY || 0;

      if (navbar) {
        if (y > 40) {
          navbar.style.top = '20px';
        } else {
          navbar.style.top = '40px';
        }
      }

      if (y > 40) {
        if (catalogDropdown && catalogDropdown.classList.contains('fixed') && catalogContent) {
          catalogDropdown.style.height = '440px';
          catalogContent.style.paddingTop = '80px';
        }
        if (accessoriesDropdown && accessoriesDropdown.classList.contains('fixed') && accessoriesContent && nosotrosDropdown && nosotrosDropdown.classList.contains('fixed') && nosotrosContent) {
          accessoriesDropdown.style.height = '260px';
          accessoriesContent.style.paddingTop = '80px';
          nosotrosDropdown.style.height = '260px';
          nosotrosContent.style.paddingTop = '80px';
        }
      } else {
        if (catalogDropdown && catalogDropdown.classList.contains('fixed') && catalogContent) {
          catalogDropdown.style.height = '480px';
          catalogContent.style.paddingTop = '128px';
        }
        if (accessoriesDropdown && accessoriesDropdown.classList.contains('fixed') && accessoriesContent && nosotrosDropdown && nosotrosDropdown.classList.contains('fixed') && nosotrosContent) {
          accessoriesDropdown.style.height = '300px';
          accessoriesContent.style.paddingTop = '128px';
          nosotrosDropdown.style.height = '300px';
          nosotrosContent.style.paddingTop = '128px';
        }
      }

      // Fondo sólido > 780
      setSolidBg(y > 780);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      id="main-navbar"
      ref={navbarRef}
      className="fixed left-1/2 -translate-x-1/2 transform z-50 transition-all duration-300"
      style={{ top: '40px' }}
    >
      <div
        id="navbar-shell"
        className={[
          'backdrop-blur-lg rounded-full px-20 py-3 shadow-2xl flex items-center justify-between gap-6 transition-colors duration-300',
          solidBg ? 'bg-black' : 'bg-black/70',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center">
            {/* Si la imagen no existe en el proyecto, el texto seguirá visible */}
            <img
              src={logoImg}
              alt="Logo"
              className="h-10 w-10 object-contain"
              onError={(e) => {
                // Oculta la imagen si no carga para evitar ícono roto
                e.currentTarget.style.display = 'none';
              }}
            />
           
          </Link>
        </div>

        {/* Enlaces principales */}
        <div className="hidden lg:flex items-center gap-6">
          <Link to="/" className="text-white font-semibold hover:text-red-400 transition-all duration-300 hover:-translate-y-1">
            Inicio
          </Link>

          {/* Dropdown Catálogo */}
          <div className="relative group">
            <button className="text-white font-semibold flex items-center gap-2 hover:text-red-400 transition-all duration-300 hover:-translate-y-1">
              Catálogo
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Contenedor dropdown Catálogo */}
            <div
              id="catalog-dropdown"
              className="absolute top-full mt-[30px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500"
              style={{ left: '-200px', transform: 'translateX(0)', width: 'min(900px, 85vw)' }}
            >
              <div className="bg-black/85 backdrop-blur-xl rounded-3xl px-8 pt-4 pb-8 border border-white/20 shadow-2xl catalog-content">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 justify-items-center place-items-center">
                  {/* Proteína */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/proteinas" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Proteína
                    </Link>
                    <Link to="/products/proteinas" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/ISO100-1.3_1440x1440.jpg?v=1721497080"
                        alt="Proteína"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>

                  {/* Creatina */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/creatina" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Creatina
                    </Link>
                    <Link to="/products/creatina" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/NUTREX_1440x1440.jpg?v=1721492842"
                        alt="Creatina"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>

                  {/* Pre entreno */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/preworkout" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Pre entreno
                    </Link>
                    <Link to="/products/preworkout" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/PORTADA_ec4a9ae4-06e4-4fb7-91c0-a61fc19fbed6_1440x1440.jpg?v=1750987008"
                        alt="Pre entreno"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>

                  {/* Aminoácidos */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/aminoacidos" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Aminoácidos
                    </Link>
                    <Link to="/products/aminoacidos" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/aminox-30_1440x1440.jpg?v=1721575679"
                        alt="Aminoácidos"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>

                  {/* Vitaminas */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/vitaminas" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Vitaminas
                    </Link>
                    <Link to="/products/vitaminas" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/PORTADA_1_5988643b-a584-41de-bb44-42f3fff9e8c7_1440x1440.jpg?v=1753489463"
                        alt="Vitaminas"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>

                  {/* Para la salud */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/salud" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Para la salud
                    </Link>
                    <Link to="/products/salud" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/PORTADA_2_1440x1440.jpg?v=1743652920"
                        alt="Salud"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>

                  {/* complementos */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/complementos" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Complementos
                    </Link>
                    <Link to="/products/complementos" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/PORTADA_7_1440x1440.png?v=1732233658"
                        alt="Complementos"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>

                  {/* Demás / Comida */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/comida" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Comida
                    </Link>
                    <Link to="/products/comida" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/PORTADA_7_1440x1440.png?v=1732233658"
                        alt="Comida"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dropdown Accesorios */}
          <div className="relative group">
            <button className="text-white font-semibold flex items-center gap-2 hover:text-red-400 transition-all duration-300 hover:-translate-y-1">
              Accesorios
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Contenedor dropdown Accesorios */}
            <div id="accesorios-dropdown" className="absolute top-full left-1/2 -translate-x-1/2 transform mt-[30px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500">
              <div className="bg-black/85 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl w-[28rem]">
                {/* Items alineados horizontalmente */}
                <div className="flex flex-row justify-center gap-10">
                  {/* Shakers */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/shakers" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Shakers
                    </Link>
                    <Link to="/products/shakers" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/PORTADA_1_5988643b-a584-41de-bb44-42f3fff9e8c7_1440x1440.jpg?v=1753489463"
                        alt="Shakers"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>
                  {/* Ropa Deportiva */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/ropa" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Ropa Deportiva
                    </Link>
                    <Link to="/products/ropa" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/PORTADA_1_5988643b-a584-41de-bb44-42f3fff9e8c7_1440x1440.jpg?v=1753489463"
                        alt="Ropa Deportiva"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>
                  {/* Bolsos */}
                  <div className="flex flex-col items-center text-center group/item">
                    <Link to="/products/bolsos" className="text-white font-medium hover:text-red-400 transition-colors mb-4 text-sm">
                      Bolsos
                    </Link>
                    <Link to="/products/bolsos" className="block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <img
                        src="https://swsuppss.com/cdn/shop/files/PORTADA_1_5988643b-a584-41de-bb44-42f3fff9e8c7_1440x1440.jpg?v=1753489463"
                        alt="Bolsos"
                        className="w-20 h-20 object-cover"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Link to="/products" className="text-white font-semibold hover:text-red-400 transition-all duration-300 hover:-translate-y-1">
            Volumen
          </Link>

          <Link to="/products" className="text-white font-semibold hover:text-red-400 transition-all duration-300 hover:-translate-y-1">
            Definición
          </Link>

          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin/products" className="text-white font-semibold hover:text-red-400 transition-all duration-300 hover:-translate-y-1">
              Admin
            </Link>
          )}

          {/* Dropdown Nosotros */}
          <div className="relative group">
            <button className="text-white font-semibold flex items-center gap-2 hover:text-red-400 transition-all duration-300 hover:-translate-y-1">
              Nosotros
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Contenedor dropdown Nosotros */}
            <div id="nosotros-dropdown" className="absolute top-full left-1/2 -translate-x-1/2 transform mt-[30px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500">
              <div className="bg-black/85 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl w-80">
                <div className="flex flex-col gap-4">
                  <a href="#" className="text-white hover:text-red-400 transition-colors p-3 rounded-xl hover:bg-white/10">
                    Historia
                  </a>
                  <a href="#" className="text-white hover:text-red-400 transition-colors p-3 rounded-xl hover:bg-white/10">
                    Equipo
                  </a>
                  <a href="#" className="text-white hover:text-red-400 transition-colors p-3 rounded-xl hover:bg-white/10">
                    Contacto
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Iconos de acción */}
  <div className="flex items-center gap-3">
          <a href="#" className="rounded-full bg-white/10 p-2 hover:bg-red-500/20 hover:scale-110 transition-all duration-300" aria-label="Favoritos">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M178,42c-21,0-39.26,9.47-50,25.34C117.26,51.47,99,42,78,42a60.07,60.07,0,0,0-60,60c0,29.2,18.2,59.59,54.1,90.31a334.68,334.68,0,0,0,53.06,37,6,6,0,0,0,5.68,0,334.68,334.68,0,0,0,53.06-37C219.8,161.59,238,131.2,238,102A60.07,60.07,0,0,0,178,42ZM128,217.11C111.59,207.64,30,157.72,30,102A48.05,48.05,0,0,1,78,54c20.28,0,37.31,10.83,44.45,28.27a6,6,0,0,0,11.1,0C140.69,64.83,157.72,54,178,54a48.05,48.05,0,0,1,48,48C226,157.72,144.41,207.64,128,217.11Z"></path>
            </svg>
          </a>

          <button onClick={handleUserClick} className="rounded-full bg-white/10 p-2 hover:bg-red-500/20 hover:scale-110 transition-all duration-300" aria-label="Usuario">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M128,128a48,48,0,1,0-48-48A48,48,0,0,0,128,128Zm0,16c-39.7,0-72,32.3-72,72a8,8,0,0,0,8,8H192a8,8,0,0,0,8-8C200,176.3,167.7,144,128,144Z"></path>
            </svg>
          </button>
          <button onClick={openSearch} className="rounded-full bg-white/10 p-2 hover:bg-red-500/20 hover:scale-110 transition-all duration-300" aria-label="Buscar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M228.24,219.76l-51.38-51.38a86.15,86.15,0,1,0-8.48,8.48l51.38,51.38a6,6,0,0,0,8.48-8.48ZM38,112a74,74,0,1,1,74,74A74.09,74.09,0,0,1,38,112Z"></path>
            </svg>
          </button>

          <button onClick={openCart} id="open-cart" className="rounded-full bg-white/10 p-2 hover:bg-red-500/20 hover:scale-110 transition-all duration-300" aria-label="Carrito">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42Zm2,158a2,2,0,0,1-2,2H40a2,2,0,0,1-2-2V56a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2ZM174,88a46,46,0,0,1-92,0,6,6,0,0,1,12,0,34,34,0,0,0,68,0,6,6,0,0,1,12,0Z"></path>
            </svg>
          </button>
          {isAuthenticated && (
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white shadow transition-colors active:scale-95"
            >
              <span className="leading-none">Salir</span>
            </button>
          )}
        </div>

        {/* Menú móvil (solo botón visible, sin panel ya que no se proporcionó HTML) */}
        <button className="lg:hidden text-white p-2 hover:text-red-400 transition-colors" aria-label="Abrir menú">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Header;