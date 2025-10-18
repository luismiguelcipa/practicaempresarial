import React from 'react';
import fotolocal from '../assets/images/fotolocal.png';
import { MapPin, Clock, Phone, MessageCircle, Navigation, Star, Store, Mail } from 'lucide-react';

const Locations = () => {
  // Datos de tu ubicación (actualiza con tus datos reales)
  const location = {
    id: 1,
    name: "INT Suplementos",
    address: "Cra 10 #22-70-Local 101, Tunja, Boyacá",
    phone: "573006851794",
    whatsapp: "573006851794",
    email: "internationalnutritioncol@gmail.com",
    coordinates: { lat: 5.53565843789193, lng: -73.36111820444094 }, //,Actualiza con tu ubicación real
    hours: {
      week: "8:30 AM - 1:00 PM, 3:00 PM - 8:00 PM",
      weekend: "10:00 AM - 5:00 PM"
    },
    isOpen: true,
    rating: 4.9,
    features: ["Parking Gratuito", "WiFi", "Aire Acondicionado", "Asesoramiento Nutricional"]
  };

  const getDayName = (dayKey) => {
    const days = {
      week: 'Lunes-sábado',
      weekend: 'Domingo'
    };
    return days[dayKey];
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${location.whatsapp.replace(/\D/g, '')}?text=Hola! Me interesa conocer más sobre sus productos.`, '_blank');
  };

  const openMaps = () => {
    const { lat, lng } = location.coordinates;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const openEmail = () => {
    window.open(`mailto:${location.email}`, '_blank');
  };

  const callPhone = () => {
    window.open(`tel:${location.phone}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Imagen de cabecera (desde /public). Si la imagen no existe, se oculta. */}
        <div className="mb-10">
          <img
            src={fotolocal}
            alt="Foto de la tienda INT Suplementos"
            className=" h-56 sm:h-72 lg:h-96 object-cover rounded-2xl shadow-xl ring-1 ring-black/5"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Nuestra Ubicación
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Visitanos en nuestra tienda física para recibir asesoramiento personalizado
            y encontrar los mejores suplementos para tus objetivos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-12">
          {/* Información de la tienda */}
          <div className="space-y-6 lg:pr-4">
            {/* Tarjeta principal */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="bg-primary-100 p-2 sm:p-3 lg:p-4 rounded-xl">
                    <Store className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">{location.name}</h2>
                    <div className="flex items-center space-x-2">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                      <span className="text-gray-600 text-xs sm:text-sm lg:text-base font-medium">{location.rating}/5.0</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        location.isOpen 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {location.isOpen ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="flex items-start space-x-3 mb-6">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary-600 mt-1" />
                <div>
                  <p className="text-gray-900 font-semibold text-sm sm:text-base lg:text-lg mb-1">Dirección</p>
                  <p className="text-gray-600 text-xs sm:text-sm lg:text-base leading-relaxed">{location.address}</p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                <button
                  onClick={openWhatsApp}
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 text-xs sm:text-sm lg:text-base font-semibold"
                >
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={callPhone}
                  className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 text-xs sm:text-sm lg:text-base font-semibold"
                >
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                  <span>Llamar</span>
                </button>
              </div>

              {/* Contacto */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary-600" />
                  <div>
                    <p className="text-gray-900 font-semibold text-sm sm:text-base lg:text-lg mb-0.5">Teléfono</p>
                    <button 
                      onClick={callPhone}
                      className="text-primary-600 hover:text-primary-700 transition-colors text-xs sm:text-sm lg:text-base font-medium"
                    >
                      {location.phone}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary-600" />
                  <div>
                    <p className="text-gray-900 font-semibold text-sm sm:text-base lg:text-lg mb-0.5">Email</p>
                    <button 
                      onClick={openEmail}
                      className="text-primary-600 hover:text-primary-700 transition-colors text-xs sm:text-sm lg:text-base font-medium break-all"
                    >
                      {location.email}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-red-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-600" />
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Horarios de Atención</h3>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {Object.entries(location.hours).map(([day, hours]) => (
                  <div key={day} className="grid grid-cols-3 gap-4 items-center py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-red-50 transition-colors duration-200 border-l-4 border-red-100 hover:border-red-300">
                    <span className="text-gray-700 font-bold text-sm sm:text-base lg:text-lg min-w-[100px]">
                      {getDayName(day)}
                    </span>
                    <div className="col-span-2 text-right">
                      <span className="text-gray-800 text-sm sm:text-base lg:text-lg font-semibold bg-gray-50 px-3 py-2 rounded-md inline-block">
                        {hours}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mapa real */}
          <div className="lg:pl-4">
            <div className="bg-white rounded-xl overflow-hidden border border-red-100 transition-all duration-500 hover:scale-105 transform" 
                 style={{
                   boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 25px -8px rgba(220, 38, 38, 0.08), 0 0 0 1px rgba(220, 38, 38, 0.03)'
                 }}>
              <div className="p-3 sm:p-4 lg:p-6 border-b border-red-50 bg-gradient-to-r from-red-50 to-white">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 flex items-center space-x-2 sm:space-x-3">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-600" />
                  <span>Ubicación en el Mapa</span>
                </h3>
              </div>
              <div className="relative">
                <iframe
                  src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3975.2!2d${location.coordinates.lng}!3d${location.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e6a42b6c0a3e3e3%3A0x1234567890!2s${encodeURIComponent(location.address)}!5e0!3m2!1ses!2sco!4v1234567890123!5m2!1ses!2sco`}
                  width="100%"
                  height="500"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de INT Suplementos"
                  className="w-full sm:h-[450px] lg:h-[550px]"
                ></iframe>
                <div className="absolute bottom-4 sm:bottom-5 lg:bottom-6 right-4 sm:right-5 lg:right-6">
                  <button
                    onClick={openMaps}
                    className="bg-white shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3 text-red-600 hover:text-white transition-all duration-300 font-medium sm:font-semibold flex items-center space-x-2 sm:space-x-3 border-2 border-red-500 hover:border-red-600 hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 text-xs sm:text-sm lg:text-base backdrop-blur-sm hover:bg-red-600"
                    style={{
                      boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Navigation className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                    <span className="hidden sm:inline">Abrir en Google Maps</span>
                    <span className="sm:hidden">Maps</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action final - Fuera del contenedor para ancho completo */}
      <div 
        className="py-8 px-4 sm:px-6 lg:px-8"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 20%, #fecaca 40%, #f87171 60%, #dc2626 80%, #b91c1c 100%)'
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-gray-900 leading-tight">¿Tienes alguna pregunta?</h2>
          <p className="text-gray-700 mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed">
            Nuestro equipo de expertos está listo para ayudarte a elegir los mejores 
            suplementos para tus objetivos de fitness y salud.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-xl mx-auto">
            <button
              onClick={openWhatsApp}
              className="bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-1 text-xs sm:text-sm lg:text-base font-semibold min-w-[180px]"
            >
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Escribenos por WhatsApp</span>
            </button>
            <button
              onClick={callPhone}
              className="bg-white text-red-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-1 text-xs sm:text-sm lg:text-base font-semibold border-2 border-red-400 min-w-[180px]"
            >
              <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Llamar ahora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;