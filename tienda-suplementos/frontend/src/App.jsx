import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import TextCarrousel from './components/TextCarrousel';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import SimpleCheckoutPage from './pages/SimpleCheckout';
import WompiCheckout from './components/WompiCheckout';
import WompiPaymentSimple from './components/WompiPaymentSimple';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import CartDrawer from './components/CartDrawer';
import SearchDrawer from './components/SearchDrawer';
import LoginModal from './components/LoginModal';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import WhatsappFloatButton from './components/WhatsappFloatButton';
import AdminProducts from './pages/AdminProducts';
import AdminCombos from './pages/AdminCombos';
import AdminCatalogView from './pages/AdminCatalogView';
import AdminLayout from './components/AdminLayout';
import RequireAdmin from './components/RequireAdmin';
import Footer from './components/fotterPrueba';
import Locations from './components/Locations';


function App() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isAdminAuthed = isAuthenticated && isAdmin;
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Ocultar elementos de tienda solo en rutas /admin (en rutas públicas se muestran aunque seas admin)
  const hideFooter = isAdminRoute || location.pathname === '/profile' || location.pathname === '/ubicaciones';
  const hideCarrousel = isAdminRoute || location.pathname === '/ubicaciones';
  const hideHeader = isAdminRoute;

  // Si es admin autenticado Y está en rutas /admin, usar AdminLayout
  if (isAdminAuthed && isAdminRoute) {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/products/:category" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/product/:id" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/cart" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/checkout" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/wompi-checkout" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/wompi-payment" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/payment-success" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/payment-failure" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/ubicaciones" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/admin/combos/:category" element={<RequireAdmin><AdminCombos /></RequireAdmin>} />
          <Route path="/admin/catalog" element={<RequireAdmin><AdminCatalogView /></RequireAdmin>} />
          <Route path="/admin/accessories" element={<RequireAdmin><AdminCatalogView /></RequireAdmin>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
        </Routes>
      </AdminLayout>
    );
  }
  
  return (
    <div>
      {/* Los admins pueden navegar a la home pública sin redirección */}
      {!hideHeader && <Header />}
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
          <Route path="/wompi-checkout" element={<WompiCheckout />} />
          <Route path="/wompi-payment" element={<WompiPaymentSimple />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failure" element={<PaymentFailure />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/ubicaciones" element={<Locations />} />
          <Route path="/sign-in" element={<Home />} />
          <Route path="/login" element={<Home />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/admin/combos/:category" element={<RequireAdmin><AdminCombos /></RequireAdmin>} />
          <Route path="/admin/catalog" element={<RequireAdmin><AdminCatalogView /></RequireAdmin>} />
          <Route path="/admin/accessories" element={<RequireAdmin><AdminCatalogView /></RequireAdmin>} />
        </Routes>
      </main>
      <WhatsappFloatButton />
      {!hideFooter && <Footer />}
    </div>
  );
}

export default App;
