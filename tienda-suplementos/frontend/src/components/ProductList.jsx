import ProductCard from './ProductCard';
import CategoryTypeTabs from './CategoryTypeTabs';

import { useEffect, useState } from 'react';
import api from '../services/api';

// Props opcionales: category, search
const ProductList = ({ category, search }) => {
	const [products, setProducts] = useState([]);
	const [filteredProducts, setFilteredProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let cancelled = false;
		const fetchProducts = async () => {
			setLoading(true);
			setError('');
			try {
				const params = {};
				if (category) params.category = category;
				if (search) params.search = search;
				const res = await api.get('/products', { params });
				if (!cancelled) {
					// Adaptar _id a id para compatibilidad con carrito existente
					const mapped = (res.data?.data || []).map(p => ({ id: p._id, ...p }));
					setProducts(mapped);
					// Si no hay filtro de tipo, mostrar todos los productos
					if (category !== 'Proteínas' && category !== 'Creatina') {
						setFilteredProducts(mapped);
					}
				}
							} catch {
						if (!cancelled) setError('Error cargando productos');
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchProducts();
		return () => { cancelled = true; };
	}, [category, search]);

	if (loading) return <p className="text-gray-400">Cargando productos...</p>;
	if (error) return <p className="text-red-500">{error}</p>;
	if (!products.length) return <p className="text-gray-400">No hay productos.</p>;

	// Determinar si mostrar pestañas de tipo (solo para Proteínas y Creatina)
	const showTypeTabs = category === 'Proteínas' || category === 'Creatina';
	const displayProducts = showTypeTabs ? filteredProducts : products;

	return (
		<div className="w-full">
			{/* Pestañas de tipo/subcategoría */}
			{showTypeTabs && (
				<CategoryTypeTabs
					category={category}
					products={products}
					onFilteredProducts={setFilteredProducts}
				/>
			)}

			{/* Grid de productos */}
			{displayProducts.length === 0 ? (
				<p className="text-gray-400 text-center py-8">No hay productos de este tipo.</p>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{displayProducts.map(product => <ProductCard key={product.id} product={product} />)}
				</div>
			)}
		</div>
	);
};

export default ProductList;

