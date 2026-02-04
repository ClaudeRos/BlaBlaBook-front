// src/routes/admin/+layout.js
import jwtDecode from '../../lib/utils/jwtDecode.js';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export async function load({ url }) {
    if (browser) {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw redirect(303, `/connexion?redirectTo=${url.pathname}`);
            }
            
            const payload = jwtDecode(token);
            console.log('Role:', payload.role);
            
            if (payload.role !== 'admin') {
                alert('Accès non autorisé');
                throw redirect(303, '/connexion');
            }
            
            return {
                user: payload
            };
        } catch (error) {
            // Re-throw les redirects
            if (error?.status === 303) {
                throw error;
            }
            
            // Autres erreurs (token invalide, etc.)
            console.error('Erreur d\'authentification:', error);
            throw redirect(303, '/connexion');
        }
    }
    
    return {};
}