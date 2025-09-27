import ProductList from '../components/ProductList';
import { useLocation } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return Object.fromEntries(new URLSearchParams(search));
}

const Products = () => {
	const query = useQuery();
	const category = query.category || undefined;
	const search = query.q || undefined;
	return (
		<div className="min-h-screen bg-gray-50 py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900">{category ? category : 'Todos los Productos'}</h1>
					<p className="mt-2 text-gray-600">{search ? `Resultados para "${search}"` : 'Explora nuestro catálogo completo'}</p>
				</div>
				<ProductList category={category} search={search} />
			</div>
		</div>
	);
};

export default Products;

