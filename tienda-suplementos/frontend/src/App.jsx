import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TextCarrousel from './components/TextCarrousel';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import SimpleCheckoutPage from './pages/SimpleCheckout';
// import CheckoutPage from './pages/Checkout';
// import PaymentSuccess from './pages/PaymentSuccess';
// import PaymentFailure from './pages/PaymentFailure';
// import PaymentPending from './pages/PaymentPending';
// import OrderConfirmation from './pages/OrderConfirmation';
import CartDrawer from './components/CartDrawer';
import SearchDrawer from './components/SearchDrawer';
import LoginModal from './components/LoginModal';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import WhatsappFloatButton from './components/WhatsappFloatButton';
import AdminProducts from './pages/AdminProducts';
import RequireAdmin from './components/RequireAdmin';


function App() {
  return (
    <div>
      <Header />
      <TextCarrousel offset={0} />
      <CartDrawer />
      <SearchDrawer />
      <LoginModal />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<SimpleCheckoutPage />} />
          {/* Checkout avanzado deshabilitado temporalmente */}
          {/* <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/pending" element={<PaymentPending />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} /> */}
          {/* /login no es una página aparte: renderiza Home y el modal se abre por ruta */}
          <Route path="/sign-in" element={<Home />} />
          <Route path="/login" element={<Home />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
        </Routes>
      </main>
      <WhatsappFloatButton />
    </div>
  );
}

export default App;
