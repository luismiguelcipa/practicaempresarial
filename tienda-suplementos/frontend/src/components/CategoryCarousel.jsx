import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  {
    id: 1,
    name: 'CREATINAS',
    subtitle: 'Click para ver mas',
    image: '/images/creatine.jpg',
    link: '/products/Creatina'
  },
  {
    id: 2,
    name: 'PRE-ENTRENOS',
    subtitle: 'Click para ver mas',
    image: '/images/preworkout.jpg',
    link: '/products/Pre-Workout'
  },
  {
    id: 3,
    name: 'AMINOACIDOS',
    subtitle: 'Click para ver mas',
    image: '/images/bcaa.jpg',
    link: '/products/Aminoácidos'
  },
  {
    id: 4,
    name: 'QUEMADORES',
    subtitle: 'Click para ver mas',
    image: '/images/bcaa.jpg',
    link: '/products/Quemadores'
  },
  {
    id: 5,
    name: 'VITAMINAS',
    subtitle: 'Click para ver mas',
    image: '/images/omega3.jpg',
    link: '/products/Vitaminas'
  },
  {
    id: 6,
    name: 'PROTEINAS',
    subtitle: 'Click para ver mas',
    image: '/images/whey-protein.jpg',
    link: '/products/Proteínas'
  }
];

export default function CategoryCarousel() {
  const scrollContainerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Duplicar categorías para efecto infinito
  const infiniteCategories = [...categories, ...categories, ...categories];

  useEffect(() => {
    // Iniciar en el medio del carrusel para permitir scroll en ambas direcciones
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = 240; // ancho aproximado de cada item + gap
      const initialScroll = categories.length * itemWidth;
      container.scrollLeft = initialScroll;
    }
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current && !isScrolling) {
      const container = scrollContainerRef.current;
      const itemWidth = 240;
      const sectionWidth = categories.length * itemWidth;

      // Si llegamos al final, volver al inicio (pero del segundo set)
      if (container.scrollLeft >= sectionWidth * 2 - 100) {
        setIsScrolling(true);
        container.scrollLeft = sectionWidth;
        setTimeout(() => setIsScrolling(false), 50);
      }
      // Si llegamos al inicio, ir al final (pero del segundo set)
      else if (container.scrollLeft <= 100) {
        setIsScrolling(true);
        container.scrollLeft = sectionWidth;
        setTimeout(() => setIsScrolling(false), 50);
      }
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
          EL PRODUCTO QUE BUSCAS
        </h2>
        <p className="text-center text-gray-600 mb-8">
          A un excelente precio y con obsequio gratis!
        </p>

        <div className="relative">
          {/* Botón Izquierdo - Siempre visible */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all"
            aria-label="Anterior"
          >
            <ChevronLeft size={24} className="text-orange-500" />
          </button>

          {/* Contenedor del carrusel */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {infiniteCategories.map((category, index) => (
              <Link
                key={`${category.id}-${index}`}
                to={category.link}
                className="flex-shrink-0 w-48 group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-3">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-sm text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-xs text-orange-500 font-medium">
                    {category.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Botón Derecho - Siempre visible */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all"
            aria-label="Siguiente"
          >
            <ChevronRight size={24} className="text-orange-500" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
