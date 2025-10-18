import ProductList from '../../components/ProductList';
import { CATEGORY_META } from '../categoryConfigs';

export default function CategoryPageBase({ title }) {
  const meta = title ? CATEGORY_META[title] : undefined;
  return (
    <div className="min-h-screen bg-gray-50">
      {meta?.hero && (
        <section
          className="relative w-full bg-black z-0"
          style={{ height: meta.hero.height || 'calc(100vh - 36px)' }}
        >
          {meta.hero.type === 'image' && (
            <img src={meta.hero.src} alt={title} className="absolute inset-0 w-full h-full object-cover" />
          )}
          {meta.hero.overlay && <div className={`absolute inset-0 ${meta.hero.overlay}`} />}
        </section>
      )}

      <div className="pt-36 md:pt-40 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">Explora nuestro catálogo de {title.toLowerCase()}</p>
        </div>
        <ProductList category={title} />
      </div>
    </div>
  );
}
