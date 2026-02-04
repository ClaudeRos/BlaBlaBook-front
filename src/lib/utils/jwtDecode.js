export default 
function decodeJWT(token) {
		try {
			const payload = token.split('.')[1];
			const decoded = JSON.parse(atob(payload));
			return decoded;
		} catch (error) {
			console.error('Erreur décodage JWT:', error);
			return null;
		}
}