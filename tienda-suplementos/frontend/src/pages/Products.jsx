import ProductList from '../components/ProductList';
import { useLocation, useParams } from 'react-router-dom';

// Mapeo de slugs (URLs) a las categorías reales según enum del backend
const CATEGORY_SLUG_MAP = {
	proteinas: 'Proteínas',
	creatina: 'Creatina',
	aminoacidos: 'Aminoácidos',
	preworkout: 'Pre-Workout',
	'pre-workout': 'Pre-Workout', // fallback si alguien usa guion
	vitaminas: 'Vitaminas',
	salud: 'Otros', // si más adelante hay categoría específica se ajusta
	complementos: 'Otros',
	comida: 'Otros',
	shakers: 'Otros',
	ropa: 'Otros',
	bolsos: 'Otros'
};

function useQuery() {
  const { search } = useLocation();
  return Object.fromEntries(new URLSearchParams(search));
}

const Products = () => {
	const query = useQuery();
	const { category: categoryParam } = useParams();
	// Prioridad: categoría en la ruta /products/:category > query ?category=xxx > alias anterior ?cat=xxx
	const categoryQuery = query.category || query.cat; // soporta el parámetro legacy cat
	let rawCategory = categoryParam || categoryQuery || undefined;

	// Normalización y traducción slug -> enum real
	let normalizedCategory = undefined;
	if (rawCategory) {
		const slug = decodeURIComponent(rawCategory).trim().toLowerCase();
		normalizedCategory = CATEGORY_SLUG_MAP[slug] || undefined;
	}

	// Si llega un slug no reconocido, se muestran todos (normalizedCategory queda undefined)
	const search = query.q || undefined;

	return (
		<div className="min-h-screen bg-gray-50 pt-36 md:pt-40 pb-12">{/* pt ampliado para que no lo tape el navbar flotante */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900">{normalizedCategory ? normalizedCategory : 'Todos los Productos'}</h1>
					<p className="mt-2 text-gray-600">{search ? `Resultados para "${search}"` : 'Explora nuestro catálogo completo'}</p>
				</div>
				<ProductList category={normalizedCategory} search={search} />
			</div>
		</div>
	);
};

export default Products;

