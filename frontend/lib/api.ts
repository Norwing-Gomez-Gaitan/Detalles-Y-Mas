const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Si existe token en localStorage (para compatibilidad cross-domain), añadirlo
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Para cookies httpOnly
  });

  if (!response.ok) {
    let errorMsg = 'Error en la solicitud';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      // Ignorar si no es JSON
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

