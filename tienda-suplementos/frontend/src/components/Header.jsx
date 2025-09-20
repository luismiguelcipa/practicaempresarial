
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import './Header.css';


const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const cartItemsCount = getTotalItems();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="floating-navbar">
      <div className="floating-navbar-inner">
        <Link to="/" className="logo">
          SportSupps
        </Link>
        <nav className="nav-menu">
          <Link to="/" className="nav-link">
            Inicio
          </Link>
          <div className="nav-link dropdown" ref={dropdownRef}>
            <button
              type="button"
              className="dropdown-btn"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              Productos <ChevronDown size={16} style={{ marginLeft: 2 }} />
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/products" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  Todos los productos
                </Link>
                <Link to="/products?cat=proteinas" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  Proteínas
                </Link>
                <Link to="/products?cat=preworkout" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  Pre-entrenos
                </Link>
                <Link to="/products?cat=accesorios" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  Accesorios
                </Link>
              </div>
            )}
          </div>
          <Link to="/cart" className="nav-link cart-link">
            <ShoppingCart size={20} />
            {cartItemsCount > 0 && (
              <span className="cart-badge">{cartItemsCount}</span>
            )}
          </Link>
          {isAuthenticated ? (
            <div className="user-menu">
              <Link to="/profile" className="nav-link user-link">
                <User size={20} />
                <span>{user?.email?.split('@')[0] || 'Usuario'}</span>
              </Link>
              <button onClick={handleLogout} className="nav-link logout-btn">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/email-login" className="nav-link login-link">
              Iniciar Sesión
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Header;