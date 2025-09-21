import React from 'react';

// Carrusel superior con animación marquee. Depende de estilos definidos en Header.css:
// - #carrusel-superior { z-index }
// - .animate-marquee { animation }
// Si prefieres mover estilos a otro archivo, dime y lo ajusto.
const TextCarrousel = () => {
	return (
		<section
			id="carrusel-superior"
			className="w-full overflow-hidden"
			style={{ backgroundColor: 'rgb(111, 32, 32)', borderBottom: '2px solid rgb(111, 32, 32)' }}
		>
			<div className="flex items-center h-9">
				<div className="w-full overflow-hidden">
					<ul className="flex animate-marquee gap-10 whitespace-nowrap">
						{/* Repeticiones para efecto continuo */}
						<li className="flex items-center gap-2">
							<svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V5a1 1 0 011-1h5a1 1 0 011 1v12m-7 0h7m-7 0a2 2 0 11-4 0m11 0a2 2 0 11-4 0"></path>
							</svg>
							<span className="text-xs text-gray-300 font-bold">Tu envio es gratis desde $0</span>
						</li>
						<li className="flex items-center gap-2">
							<svg className="w-4 h-4 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<rect x="2" y="7" width="20" height="10" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
								<path d="M2 11h20" strokeWidth="2" stroke="currentColor" />
							</svg>
							<span className="text-xs text-gray-300 font-bold">Compra más, ahorra más</span>
						</li>
						<li className="flex items-center gap-2">
							<svg className="w-4 h-4 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
								<path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" stroke="currentColor" />
							</svg>
							<span className="text-xs text-gray-300 font-bold">Combos imperdibles HOY</span>
						</li>
						{/* duplicados para llenar el carrusel */}
						<li className="flex items-center gap-2">
							<svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V5a1 1 0 011-1h5a1 1 0 011 1v12m-7 0h7m-7 0a2 2 0 11-4 0m11 0a2 2 0 11-4 0"></path>
							</svg>
							<span className="text-xs text-gray-300 font-bold">Tu envio es gratis desde $0</span>
						</li>
						<li className="flex items-center gap-2">
							<svg className="w-4 h-4 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<rect x="2" y="7" width="20" height="10" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
								<path d="M2 11h20" strokeWidth="2" stroke="currentColor" />
							</svg>
							<span className="text-xs text-gray-300 font-bold">Compra más, ahorra más</span>
						</li>
						<li className="flex items-center gap-2">
							<svg className="w-4 h-4 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
								<path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" stroke="currentColor" />
							</svg>
							<span className="text-xs text-gray-300 font-bold">Combos imperdibles HOY</span>
						</li>
						<li className="flex items-center gap-2">
							<svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V5a1 1 0 011-1h5a1 1 0 011 1v12m-7 0h7m-7 0a2 2 0 11-4 0m11 0a2 2 0 11-4 0"></path>
							</svg>
							<span className="text-xs text-gray-300 font-bold">Tu envio es gratis desde $0</span>
						</li>
						<li className="flex items-center gap-2">
							<svg className="w-4 h-4 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<rect x="2" y="7" width="20" height="10" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
								<path d="M2 11h20" strokeWidth="2" stroke="currentColor" />
							</svg>
							<span className="text-xs text-gray-300 font-bold">Compra más, ahorra más</span>
						</li>
						<li className="flex items-center gap-2">
							<svg className="w-4 h-4 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
								<path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" stroke="currentColor" />
							</svg>
							<span className="text-xs text-gray-300 font-bold">Combos imperdibles HOY</span>
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
};

export default TextCarrousel;
