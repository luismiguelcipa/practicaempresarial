import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TextCarrousel from './components/TextCarrousel';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import CartDrawer from './components/CartDrawer';
import SearchDrawer from './components/SearchDrawer';
import LoginModal from './components/LoginModal';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import WhatsappFloatButton from './components/WhatsappFloatButton';


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
          {/* /login no es una página aparte: renderiza Home y el modal se abre por ruta */}
          <Route path="/sign-in" element={<Home />} />
          <Route path="/login" element={<Home />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <WhatsappFloatButton />
    </div>
  );
}

export default App;
