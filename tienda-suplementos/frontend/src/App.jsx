import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import TextCarrousel from './components/TextCarrousel';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import SimpleCheckoutPage from './pages/SimpleCheckout';
import CartDrawer from './components/CartDrawer';
import SearchDrawer from './components/SearchDrawer';
import LoginModal from './components/LoginModal';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import WhatsappFloatButton from './components/WhatsappFloatButton';
import AdminProducts from './pages/AdminProducts';
import RequireAdmin from './components/RequireAdmin';
import Footer from './components/fotterPrueba';
import Locations from './components/Locations';


function App() {
  const location = useLocation();
  const hideFooter = location.pathname === '/profile' || location.pathname.startsWith('/admin') || location.pathname === '/ubicaciones';
  const hideCarrousel = location.pathname === '/ubicaciones';
  
  return (
    <div>
      <Header />
      {!hideCarrousel && <TextCarrousel offset={0} />}
      <CartDrawer />
      <SearchDrawer />
      <LoginModal />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:category" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<SimpleCheckoutPage />} />
          <Route path="/ubicaciones" element={<Locations />} />
          <Route path="/sign-in" element={<Home />} />
          <Route path="/login" element={<Home />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
        </Routes>
      </main>
      <WhatsappFloatButton />
      {!hideFooter && <Footer />}
    </div>
  );
}

export default App;
