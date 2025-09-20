import { useAuth } from '../context/AuthContext';

export default function Profile() {
	const { user, isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p>Debes iniciar sesión para ver tu perfil.</p>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-4">Perfil</h1>
			<div className="bg-white shadow rounded-lg p-4">
				<p><strong>Email:</strong> {user?.email}</p>
				<p><strong>Nombre:</strong> {user?.firstName} {user?.lastName}</p>
			</div>
		</div>
	);
}

