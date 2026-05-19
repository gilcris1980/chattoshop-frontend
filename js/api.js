// Auto-detect backend URL based on environment
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return 'https://chattoshop-api.onrender.com/api';
    }

    return 'https://chattoshop-api.onrender.com/api';
};

const API_BASE_URL = 'https://chattoshop-api.onrender.com/api';

const formatCurrency = (amount) => {
    return '₱' + parseFloat(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const getStorageUrl = (path) => {

    if (!path) {
        return 'https://via.placeholder.com/300x300?text=No+Image';
    }

    // already full URL
    if (path.startsWith('http')) {
        return path;
    }

    // remove leading slash if naa
    path = path.replace(/^\/+/, '');

   return `https://chattoshop-api.onrender.com/${path}`;
};

const api = {
    baseUrl: API_BASE_URL,
    storageUrl: 'return `https://chattoshop-api.onrender.com/${path}`;',
    
    formatCurrency,
    
    getStorageUrl,
    
    getToken() {
        return localStorage.getItem('token');
    },
    
    setToken(token) {
        console.log('setToken called with:', token ? token.substring(0, 30) + '...' : null);
        localStorage.setItem('token', token);
        console.log('Token stored in localStorage:', localStorage.getItem('token') ? localStorage.getItem('token').substring(0, 30) + '...' : null);
    },
    
    removeToken() {
        localStorage.removeItem('token');
    },
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
        this.updateUserUI(user);
    },
    
    removeUser() {
        localStorage.removeItem('user');
    },
    
    updateUserUI(user) {
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) userName.textContent = user?.name || 'User';
        if (userAvatar && user?.avatar) {
            userAvatar.src = this.getStorageUrl(user.avatar);
        }
    },
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();
        
        console.log('Request:', endpoint, 'Token exists:', !!token, 'Token:', token ? token.substring(0, 20) + '...' : null);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Authorization header set:', headers['Authorization'].substring(0, 30) + '...');
        } else {
            console.log('No token available for request');
        }
        
        const config = {
            ...options,
            headers,
        };
        
        try {
            const response = await fetch(url, config);
            
            if (response.status === 204) {
                return { success: true };
            }
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                console.error('Failed to parse response:', text);
                throw new Error(`Server error: ${response.status} - ${text.substring(0, 100)}`);
            }
            
            console.log('Response:', response.status, data);
            
            if (!response.ok) {
                const error = new Error(data.message || data.error || 'Request failed');
                error.data = data;
                error.status = response.status;
                throw error;
            }
            
            return data;
        } catch (error) {
            if (error.message) {
                throw error;
            }
            throw new Error('Network error. Please check your connection.');
        }
    },
    
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    post(endpoint, data) {
        console.log('API POST:', this.baseUrl + endpoint, data);
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    async markNotificationsRead() {

    return this.request(
        '/notifications/read-all',
        {
            method: 'POST'
        }
    );

},  
    
    async upload(endpoint, formData, method = 'POST') {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();
        
        if (method !== 'POST') {
            formData.append('_method', method);
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });
        
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(`Server error: ${response.status}`);
        }
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Upload failed');
        }
        
        return data;
    }
};

window.api = api;