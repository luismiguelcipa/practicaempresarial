import ProductCard from './ProductCard';


import { useEffect, useState } from 'react';
import api from '../services/api';

// Props opcionales: category, search
const ProductList = ({ category, search }) => {
	const [products, setProducts] = useState([]);
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

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			{products.map(product => <ProductCard key={product.id} product={product} />)}
		</div>
	);
};

export default ProductList;

