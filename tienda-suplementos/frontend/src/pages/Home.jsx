import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import FeaturedTypeTabs from '../components/FeaturedTypeTabs';
import CategoryCarousel from '../components/CategoryCarousel';
import { products } from '../data/products';
import heroVideo from '../assets/images/d74e90ff5ff8439aa70ba7559fa09ab7.HD-720p-4.5Mbps-51800263.mp4';

const Home = () => {
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {/* Hero Video - Full screen menos el alto del carrusel superior (h-9 = 36px) */}
      <section
        className="relative w-full bg-black z-0"
        style={{ height: 'calc(100vh - 36px)' }}
      >
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Overlay opcional para CTA sobre el video (agregar si se requiere) */}
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-primary-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Envío Gratis</h3>
              <p className="text-gray-600">DESDE $0</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-primary-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Garantía</h3>
              <p className="text-gray-600">30 días de garantía</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-primary-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Calidad Premium</h3>
              <p className="text-gray-600">Productos certificados</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="text-primary-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Devoluciones</h3>
              <p className="text-gray-600">Fácil proceso de devolución</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Productos Destacados
            </h2>
            <p className="text-lg text-gray-600">
              Los suplementos más populares de nuestra tienda
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {/* Tabs de filtrado por objetivo - Debajo de los productos */}
          <FeaturedTypeTabs 
            products={products}
          />
          
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="btn-primary"
            >
              Ver Todos los Productos
            </Link>
          </div>
        </div>
      </section>
        <h2>ola</h2>
      {/* Category Carousel */}
      <CategoryCarousel />
    </div>
  );
};

export default Home;