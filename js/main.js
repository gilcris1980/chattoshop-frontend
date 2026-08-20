let cart = JSON.parse(localStorage.getItem('cart')) || [];
let dropdownOpen = false;

document.addEventListener('DOMContentLoaded', () => {

    console.log('MAIN JS LOADED');

    checkAuth();
    loadCategories();
    loadProducts();
    updateCartUI();
    setupEventListeners();

});

function setupEventListeners() {

    document.getElementById('cart-btn')?.addEventListener('click', () => {
        window.location.href = 'cart.html';
    });

    document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileMenu);

    document.getElementById('notification-btn')?.addEventListener('click', toggleNotifications);

    document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {

        e.stopPropagation();

        toggleDropdown();

    });

    document.addEventListener('click', (e) => {

        const dropdown = document.getElementById('user-dropdown');
        const btn = document.getElementById('user-menu-btn');

        if (
            dropdown &&
            btn &&
            !btn.contains(e.target) &&
            !dropdown.contains(e.target)
        ) {

            closeDropdown();

        }

    });

}

function toggleDropdown() {

    dropdownOpen = !dropdownOpen;

    const dropdown = document.getElementById('user-dropdown');

    if (!dropdown) return;

    if (dropdownOpen) {

        dropdown.classList.remove('hidden');

    } else {

        dropdown.classList.add('hidden');

    }

}

function closeDropdown() {

    dropdownOpen = false;

    const dropdown = document.getElementById('user-dropdown');

    if (dropdown) {

        dropdown.classList.add('hidden');

    }

}

function checkAuth() {

    const user = api.getUser();
    const token = api.getToken();

    const currentPage =
        window.location.pathname.split('/').pop();

    // PAGES NGA NEED LOGIN
    const protectedPages = [
        'dashboard.html',
        'profile.html',
        'orders.html',
        'checkout.html',
        'seller-dashboard.html',
        'seller-products.html',
        'admin-dashboard.html',
        'admin-users.html'
    ];

    // IF WALAY LOGIN
    if (
        protectedPages.includes(currentPage)
        && (!user || !token)
    ) {

        window.location.href = 'login.html';
        return;

    }

    // IF LOGGED IN NA TAPOS NASA LOGIN/REGISTER
    if (
        user &&
        token &&
        (
            currentPage === 'login.html' ||
            currentPage === 'register.html'
        )
    ) {

        if (
            user.role === 'admin' ||
            user.role === 'system_admin'
        ) {

            window.location.href =
                'admin-dashboard.html';

        }
        else if (user.role === 'seller') {

            window.location.href =
                'seller-dashboard.html';

        }
        else {

            window.location.href =
                'index.html';

        }

        return;

    }

    // NAVIGATION UI
    const navAuth =
        document.getElementById('nav-auth');

    const navUser =
        document.getElementById('nav-user');

    if (user && token) {

        navAuth?.classList.add('hidden');
        navUser?.classList.remove('hidden');

        // USER INFO
        const userName =
            document.getElementById('user-name');

        const dropdownName =
            document.getElementById('dropdown-user-name');

        const dropdownEmail =
            document.getElementById('dropdown-user-email');

        if (userName)
            userName.textContent =
                user.name || 'User';

        if (dropdownName)
            dropdownName.textContent =
                user.name || 'User';

        if (dropdownEmail)
            dropdownEmail.textContent =
                user.email || '';

        // AVATAR
        const avatar =
            document.getElementById('user-avatar');

        if (avatar) {

            avatar.src =
                user.avatar
                ? api.getStorageUrl(user.avatar)
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`;

        }

        // ROLE NAVIGATION
        setupRoleNavigation(user);

        // MOBILE MENU AUTH STATE
        const mobileAuth = document.getElementById('mobile-auth');
        const mobileUser = document.getElementById('mobile-user');
        if (mobileAuth) mobileAuth.classList.add('hidden');
        if (mobileUser) mobileUser.classList.remove('hidden');

        loadNotifications();

    } else {

        navAuth?.classList.remove('hidden');
        navUser?.classList.add('hidden');

        // MOBILE MENU AUTH STATE
        const mobileAuth = document.getElementById('mobile-auth');
        const mobileUser = document.getElementById('mobile-user');
        if (mobileAuth) mobileAuth.classList.remove('hidden');
        if (mobileUser) mobileUser.classList.add('hidden');

    }

}

function setupRoleNavigation(user) {

    const dashboardLink = document.getElementById('dashboard-link');
    const myProductsLink = document.getElementById('my-products-link');
    const sellerLink = document.getElementById('seller-link');
    const adminLink = document.getElementById('admin-link');
    const navMyProducts = document.getElementById('nav-my-products');
    const cartBtn = document.getElementById('cart-btn');
    const myOrdersLink = document.getElementById('my-orders-link');

    // MOBILE MENU
    const mobileDashboard = document.getElementById('mobile-dashboard');
    const mobileMyProducts = document.getElementById('mobile-my-products');
    const mobileSeller = document.getElementById('mobile-seller');
    const mobileAdmin = document.getElementById('mobile-admin');
    const mobileMyOrders = document.getElementById('mobile-my-orders');

    // RESET
    dashboardLink?.classList.add('hidden');
    myProductsLink?.classList.add('hidden');
    sellerLink?.classList.add('hidden');
    adminLink?.classList.add('hidden');
    navMyProducts?.classList.add('hidden');
    mobileDashboard?.classList.add('hidden');
    mobileMyProducts?.classList.add('hidden');
    mobileSeller?.classList.add('hidden');
    mobileAdmin?.classList.add('hidden');

    // SELLER
    if (user.role === 'seller') {

        myProductsLink?.classList.remove('hidden');
        sellerLink?.classList.remove('hidden');
        navMyProducts?.classList.remove('hidden');
        cartBtn?.classList.add('hidden');
        myOrdersLink?.classList.add('hidden');
        mobileMyProducts?.classList.remove('hidden');
        mobileSeller?.classList.remove('hidden');
        mobileMyOrders?.classList.add('hidden');

    }

    // ADMIN
    else if (
        user.role === 'admin' ||
        user.role === 'system_admin'
    ) {

        dashboardLink?.classList.remove('hidden');
        adminLink?.classList.remove('hidden');
        cartBtn?.classList.add('hidden');
        myOrdersLink?.classList.add('hidden');
        mobileDashboard?.classList.remove('hidden');
        mobileAdmin?.classList.remove('hidden');
        mobileMyOrders?.classList.add('hidden');

    }

    // CUSTOMER
    else {

        dashboardLink?.classList.remove('hidden');
        myOrdersLink?.classList.add('hidden');
        mobileDashboard?.classList.remove('hidden');
        mobileMyOrders?.classList.add('hidden');

    }

}

function toggleMobileMenu() {

    const menu = document.getElementById('mobile-menu');

    if (menu) {

        menu.classList.toggle('hidden');

    }

}

async function loadCategories() {

    const grid = document.getElementById('categories-grid');

    if (!grid) return;

    try {

        const data = await api.get('/categories?status=1');

        const categories = data.data || data;

        grid.innerHTML = categories.map(cat => `
            <a href="products.html?category=${cat.id}" class="category-card bg-white p-4 rounded-lg shadow text-center hover:shadow-lg transition cursor-pointer">
                <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <i class="fas fa-tag text-indigo-600"></i>
                </div>
                <p class="font-medium text-gray-700">${cat.name}</p>
            </a>
        `).join('');

    } catch (error) {

        console.error(error);

    }

}

async function loadProducts() {

    const grid = document.getElementById('products-grid');

    if (!grid) return;

    try {

        const data = await api.get('/products?status=1&per_page=8');

        const products = data.data || data;

        if (!products.length) {

            grid.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    No products available
                </div>
            `;

            return;

        }

        grid.innerHTML = products.map(product => `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden transition duration-300 hover:shadow-lg">

                <a href="product-detail.html?id=${product.id}">

                    <div class="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">

                        ${
                            product.image
                            ? `<img src="${api.getStorageUrl(product.image)}"
                                   class="w-full h-full object-cover">`
                            : `<i class="fas fa-image text-4xl text-gray-400"></i>`
                        }

                    </div>

                </a>

                <div class="p-4">

                    <h3 class="font-semibold text-gray-800 mb-1 truncate">
                        ${product.name}
                    </h3>

                    <p class="text-sm text-gray-500 mb-2">
                        ${product.category?.name || 'Uncategorized'}
                    </p>

                    <div class="flex justify-between items-center">

                        <span class="text-lg font-bold text-indigo-600">
                            ${api.formatCurrency(product.price)}
                        </span>

                        ${(() => {
                            const user = api.getUser();
                            if (user && user.role !== 'customer') return '';
                            return `
                            <button
                                onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image || ''}', ${product.stock})"
                                class="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm"
                            >
                                Add
                            </button>`;
                        })()}

                    </div>

                </div>

            </div>
        `).join('');

    } catch (error) {

        console.error(error);

    }

}

function addToCart(id, name, price, image, stock) {

    const existing = cart.find(item => item.id === id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty >= stock) {
        showToast('Maximum available stock reached.');
        return;
    }

    if (existing) {

        existing.quantity++;

    } else {

        cart.push({
            id,
            name,
            price: parseFloat(price),
            image,
            stock,
            quantity: 1
        });

    }

    localStorage.setItem('cart', JSON.stringify(cart));

    updateCartUI();

    showToast('Added to cart');

}

function updateCartUI() {

    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cart-count');

    if (cartCount) {

        cartCount.textContent = count;

        if (count > 0) {
            cartCount.classList.remove('hidden');
            cartCount.classList.remove('badge-pulse');
            void cartCount.offsetWidth;
            cartCount.classList.add('badge-pulse');
        } else {
            cartCount.classList.add('hidden');
        }

    }

}

function logout() {

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');

    window.location.href = 'login.html';

}

async function loadNotifications() {
    try {
        const response = await api.get('/notifications');
              const notifications = Array.isArray(response)
    ? response
    : response.data || [];

        const container = document.getElementById('notifications-list');
        const unreadNotifications =
           notifications.filter(
           notif => !notif.is_read
            );

          updateNotificationBadge(
          unreadNotifications.length
           );
        if (!container) return;

        if (!notifications.length) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    No notifications
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notification => {
            const icon = getNotifIcon(notification.type);
            const displayTitle = getNotifTitle(notification.type, notification.title);
            const { orderRef, description } = parseOrderRef(notification.message);
            const time = timeAgo(notification.created_at);

            return `
            <div class="px-4 py-3 border-b border-gray-100 hover:bg-indigo-50 transition duration-150 ease-in-out">
                <div class="flex gap-3">
                    <div class="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <i class="fas ${icon} text-indigo-600 text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2">
                            <p class="font-semibold text-sm text-gray-800 truncate">${displayTitle}</p>
                            ${
                                !notification.read_at
                                    ? `<span class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>`
                                    : ''
                            }
                        </div>
                        ${orderRef ? `<p class="text-xs font-medium text-indigo-600 mt-0.5">${orderRef}</p>` : ''}
                        <p class="text-sm text-gray-600 mt-0.5 leading-snug">${description}</p>
                        <p class="text-xs text-gray-400 mt-1">${time}</p>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load notifications', error);
    }
}

function getNotifIcon(type) {
    const icons = {
        order_status: 'fa-shopping-bag',
        order_update: 'fa-truck',
        order_completed: 'fa-check-circle',
        order_shipped: 'fa-shipping-fast',
        payment: 'fa-credit-card',
        system: 'fa-cog',
    };
    return icons[type] || 'fa-bell';
}

function getNotifTitle(type, fallback) {
    const titles = {
        order_status: 'Order Update',
        order_update: 'Order Update',
        order_completed: 'Order Completed',
        order_shipped: 'Order Shipped',
        payment: 'Payment Update',
        system: 'System Notice',
    };
    return titles[type] || fallback || 'Notification';
}

function parseOrderRef(message) {
    const match = message && message.match(/^(Order\s+#\d+)[:\s]\s*(.*)/);
    if (match) {
        return { orderRef: match[1], description: match[2] };
    }
    return { orderRef: null, description: message || '' };
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return seconds + 's ago';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return minutes + ' mins ago';
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return hours + ' hours ago';
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    if (days < 30) return days + ' days ago';
    return date.toLocaleDateString();
}
function updateNotificationBadge(count) {

    const badge =
        document.getElementById('notif-badge');

    if (!badge) return;

    if (count > 0) {

        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
        badge.classList.remove('badge-pulse');
        void badge.offsetWidth;
        badge.classList.add('badge-pulse');

    } else {

        badge.classList.add('hidden');

    }

}
async function markAllNotificationsRead() {

    try {

        await api.markNotificationsRead();

        await loadNotifications();

        const dropdown =
            document.getElementById(
                'notification-dropdown'
            );

        if (dropdown) {
            dropdown.classList.add('hidden');
        }

    } catch (error) {

        console.error(
            'Failed to mark notifications as read',
            error
        );

    }
}

async function toggleNotifications() {

}


async function toggleNotifications() {

    const dropdown =
        document.getElementById('notification-dropdown');

    if (!dropdown) {
        console.log('Notification dropdown not found');
        return;
    }

    dropdown.classList.toggle('hidden');

    if (!dropdown.classList.contains('hidden')) {

        await loadNotifications();

    }

}

function showToast(message) {

    const toast = document.createElement('div');

    toast.className = `
        fixed bottom-4 right-4
        bg-green-500 text-white
        px-6 py-3 rounded-lg shadow-lg z-50
    `;

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.remove();

    }, 3000);

}
window.toggleNotifications = toggleNotifications;
window.loadNotifications = loadNotifications;
window.logout = logout;
window.addToCart = addToCart;