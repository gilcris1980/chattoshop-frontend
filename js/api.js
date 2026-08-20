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

    // if full URL na
    if (path.startsWith('http')) {
        return encodeURI(path);
    }

    // remove domain if naa
    path = path.replace('https://chattoshop-api.onrender.com/', '');

    // convert backslashes to slashes
    path = path.replace(/\\/g, '/');

    // remove leading slash
    path = path.replace(/^\/+/, '');

    // remove duplicate storage
    if (path.startsWith('storage/')) {
        path = path.replace('storage/', '');
    }

    return encodeURI(`https://chattoshop-api.onrender.com/storage/${path}`);
};

const api = {
    baseUrl: API_BASE_URL,
    storageUrl: 'https://chattoshop-api.onrender.com',

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
                throw new Error('Something went wrong while processing your request. Please try again later.');
            }
            
            console.log('Response:', response.status, data);
            
            if (!response.ok) {
                if (!options.skipVerificationRedirect && response.status === 403 && (data.needs_verification || (data.message && data.message.includes('not verified')))) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (data.email) {
                        sessionStorage.setItem('verify_email', data.email);
                    }
                    sessionStorage.setItem('verify_message', 'Please verify your email first.');
                    window.location.href = './verify-email.html';
                    throw new Error('Email not verified');
                }
                const error = new Error(data.message || data.error || 'Something went wrong while processing your request. Please try again later.');
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
    
    post(endpoint, data, options = {}) {
        console.log('API POST:', this.baseUrl + endpoint, data);
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options,
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
        
        if (response.status === 204) {
            return { success: true };
        }
        
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(`Server error: ${response.status}`);
        }
        
        if (!response.ok) {
            if (response.status === 403 && (data.needs_verification || (data.message && data.message.includes('not verified')))) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (data.email) {
                    sessionStorage.setItem('verify_email', data.email);
                }
                sessionStorage.setItem('verify_message', 'Please verify your email first.');
                window.location.href = './verify-email.html';
                throw new Error('Email not verified');
            }
            const error = new Error(data.message || data.error || 'Upload failed');
            error.data = data;
            error.status = response.status;
            throw error;
        }
        
        return data;
    },

    /*
    |--------------------------------------------------------------------------
    | CART
    | Server cart for logged-in customers, localStorage for guests.
    |--------------------------------------------------------------------------
    */

    isLoggedIn() {
        return !!this.getToken() && !!this.getUser();
    },

    getLocalCart() {
        try {
            return JSON.parse(localStorage.getItem('cart')) || [];
        } catch (e) {
            return [];
        }
    },

    setLocalCart(items) {
        localStorage.setItem('cart', JSON.stringify(items));
    },

    clearLocalCart() {
        localStorage.removeItem('cart');
    },

    async mergeLocalCartToServer() {
        if (!this.isLoggedIn()) return;
        const local = this.getLocalCart();
        if (!local.length) return;
        for (const item of local) {
            try {
                await this.post('/cart/items', {
                    product_id: item.id,
                    quantity: Math.min(item.quantity, item.stock || item.quantity)
                });
            } catch (e) {
                // skip items that are no longer available
            }
        }
        this.clearLocalCart();
    },

    async cartGetItems() {
        const user = this.getUser();
        if (this.isLoggedIn() && user && user.role === 'customer') {
            await this.mergeLocalCartToServer();
            const data = await this.get('/cart');
            return (data.items || []).map(item => ({
                id: item.product_id,
                name: item.product?.name || 'Product',
                price: parseFloat(item.product?.price || 0),
                image: item.product?.image || '',
                stock: item.product?.stock || 0,
                quantity: item.quantity
            }));
        }
        if (this.isLoggedIn()) {
            return [];
        }
        return this.getLocalCart();
    },

    async cartCount() {
        const items = await this.cartGetItems();
        return items.reduce((sum, item) => sum + item.quantity, 0);
    },

    async cartAdd(product, qty) {
        qty = parseInt(qty, 10) || 1;
        if (qty < 1) throw new Error('Quantity must be at least 1.');
        if (this.isLoggedIn()) {
            return await this.post('/cart/items', {
                product_id: product.id,
                quantity: qty
            });
        }
        const items = this.getLocalCart();
        const existing = items.find(item => item.id === product.id);
        const totalQty = (existing ? existing.quantity : 0) + qty;
        if (totalQty > product.stock) throw new Error('Maximum available stock reached.');
        if (existing) {
            existing.quantity = totalQty;
        } else {
            items.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image || '',
                stock: product.stock,
                quantity: qty
            });
        }
        this.setLocalCart(items);
    },

    async cartSetQuantity(productId, qty) {
        qty = parseInt(qty, 10);
        if (qty < 1) throw new Error('Quantity must be at least 1.');
        if (this.isLoggedIn()) {
            return await this.put('/cart/items/' + productId, { quantity: qty });
        }
        const items = this.getLocalCart();
        const existing = items.find(item => item.id === productId);
        if (!existing) throw new Error('Item not found in cart.');
        if (qty > existing.stock) throw new Error('Maximum available stock reached.');
        existing.quantity = qty;
        this.setLocalCart(items);
    },

    async cartRemoveItem(productId) {
        if (this.isLoggedIn()) {
            return await this.delete('/cart/items/' + productId);
        }
        this.setLocalCart(this.getLocalCart().filter(item => item.id !== productId));
    },

    async cartClear() {
        if (this.isLoggedIn()) {
            try {
                await this.delete('/cart');
            } catch (e) {
                // ignore clear failures
            }
        }
        this.clearLocalCart();
    },

    async updateCartBadge() {
        const el = document.getElementById('cart-count');
        if (!el) return;
        try {
            const count = await this.cartCount();
            el.textContent = count;
            if (count > 0) {
                el.classList.remove('hidden');
                el.classList.remove('badge-pulse');
                void el.offsetWidth;
                el.classList.add('badge-pulse');
            } else {
                el.classList.add('hidden');
            }
        } catch (error) {
            console.error('Failed to load cart count:', error);
        }
    }
};

window.api = api;