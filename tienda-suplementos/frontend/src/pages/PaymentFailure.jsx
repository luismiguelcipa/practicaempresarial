import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const [errorDetails, setErrorDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getErrorDetails = async () => {
      try {
        const paymentId = searchParams.get('payment_id');
        const externalReference = searchParams.get('external_reference');
        
        if (paymentId) {
          const response = await api.get(`/payments/status/${paymentId}`);
          setErrorDetails(response.data);
        }
      } catch (error) {
        console.error('Error obteniendo detalles del pago:', error);
      } finally {
        setLoading(false);
      }
    };

    getErrorDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verificando el estado del pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* Icono de error */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Título principal */}
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Pago No Procesado
          </h1>

          <p className="text-gray-600 text-lg mb-6">
            Hubo un problema al procesar tu pago
          </p>

          {/* Detalles del error */}
          {errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-lg mb-4 text-red-800">¿Qué pasó?</h3>
              
              <div className="space-y-2 mb-4 text-sm">
                {errorDetails.status_detail && (
                  <p className="text-red-700">
                    <strong>Motivo:</strong> {getErrorMessage(errorDetails.status_detail)}
                  </p>
                )}
                
                <p className="text-gray-600">
                  <strong>ID de Transacción:</strong> {errorDetails.id || 'No disponible'}
                </p>
              </div>
            </div>
          )}

          {/* Razones comunes */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-lg mb-4">Razones más comunes:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Fondos insuficientes en la tarjeta
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Datos de la tarjeta incorrectos
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                La tarjeta está vencida o bloqueada
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Límite de compra excedido
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Problemas de conexión durante el proceso
              </li>
            </ul>
          </div>

          {/* Qué hacer ahora */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>💡 ¿Qué puedes hacer?</strong><br/>
              • Verifica los datos de tu tarjeta<br/>
              • Contacta a tu banco si es necesario<br/>
              • Intenta con otro método de pago<br/>
              • Los productos siguen en tu carrito
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/checkout"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Intentar Nuevamente
            </Link>
            
            <Link
              to="/cart"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Ver Carrito
            </Link>
            
            <Link
              to="/products"
              className="text-blue-600 px-6 py-3 rounded-lg font-medium hover:text-blue-800 transition-colors border border-blue-600"
            >
              Seguir Comprando
            </Link>
          </div>

          {/* Soporte */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-gray-500 text-sm">
              ¿Sigues teniendo problemas? 
              <a 
                href="https://wa.me/1234567890" 
                className="text-blue-600 hover:text-blue-800 ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contáctanos por WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Función para traducir mensajes de error de MercadoPago
const getErrorMessage = (statusDetail) => {
  const errorMessages = {
    'cc_rejected_insufficient_amount': 'Fondos insuficientes',
    'cc_rejected_bad_filled_card_number': 'Número de tarjeta incorrecto',
    'cc_rejected_bad_filled_date': 'Fecha de vencimiento incorrecta',
    'cc_rejected_bad_filled_security_code': 'Código de seguridad incorrecto',
    'cc_rejected_call_for_authorize': 'Debes autorizar el pago con tu banco',
    'cc_rejected_card_disabled': 'Tarjeta deshabilitada',
    'cc_rejected_duplicated_payment': 'Pago duplicado',
    'cc_rejected_high_risk': 'Pago rechazado por políticas de riesgo',
    'cc_rejected_max_attempts': 'Máximo número de intentos excedido',
    'cc_rejected_other_reason': 'La tarjeta no procesó el pago'
  };
  
  return errorMessages[statusDetail] || 'Error no especificado';
};

export default PaymentFailure;