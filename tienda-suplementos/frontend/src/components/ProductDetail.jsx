import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { products } from '../data/products';

const ProductDetail = () => {
	const { id } = useParams();
	const product = products.find((p) => String(p.id) === id);
	const { addToCart } = useCart();

	if (!product) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
					<Link to="/products" className="btn-primary">Volver a productos</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-12">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-xl shadow p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div>
						<img src={product.image} alt={product.name} className="w-full h-auto rounded-lg object-cover" />
					</div>
					<div>
						<h1 className="text-3xl font-bold mb-2">{product.name}</h1>
						<p className="text-gray-600 mb-4">{product.description}</p>
						<div className="text-2xl font-bold text-primary-600 mb-6">${product.price}</div>
						<button
							onClick={() => addToCart(product)}
							className="btn-primary"
						>
							Agregar al carrito
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProductDetail;

