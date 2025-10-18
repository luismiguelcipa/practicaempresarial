// Configuración de categorías: permite personalizar hero/estilos sin crear 8 páginas duplicadas.
// Puedes añadir más props como colores, CTA, descripciones, etc.

import proteinasImg from '../assets/images/proteinas.jpg';

export const CATEGORY_META = {
  'Proteínas': {
    hero: {
      type: 'image',
      src: proteinasImg,
      height: 'calc(100vh - 36px)', // misma altura que el video de Home
      overlay: 'bg-black/20',
    }
  },
  // 'Creatina': { hero: { type: 'image', src: creatinaImg, height: 'calc(100vh - 36px)', overlay: 'bg-black/20' } },
  // Añade el resto según lo necesites
};

export default CATEGORY_META;
