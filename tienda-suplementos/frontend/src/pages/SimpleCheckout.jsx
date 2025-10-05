import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SimpleCheckout from '../components/SimpleCheckout';

const SimpleCheckoutPage = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <SimpleCheckout />;
};

export default SimpleCheckoutPage;