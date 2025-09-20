import ProductList from '../components/ProductList';

const Products = () => {
	return (
		<div className="min-h-screen bg-gray-50 py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900">Todos los Productos</h1>
					<p className="mt-2 text-gray-600">Explora nuestro catálogo completo</p>
				</div>
				<ProductList />
			</div>
		</div>
	);
};

export default Products;

