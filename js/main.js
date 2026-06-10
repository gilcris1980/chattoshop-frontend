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

        loadNotifications();

    } else {

        navAuth?.classList.remove('hidden');
        navUser?.classList.add('hidden');

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

    // RESET
    dashboardLink?.classList.add('hidden');
    myProductsLink?.classList.add('hidden');
    sellerLink?.classList.add('hidden');
    adminLink?.classList.add('hidden');
    navMyProducts?.classList.add('hidden');

    // SELLER
    if (user.role === 'seller') {

        myProductsLink?.classList.remove('hidden');
        sellerLink?.classList.remove('hidden');
        navMyProducts?.classList.remove('hidden');
        cartBtn?.classList.add('hidden');
        myOrdersLink?.classList.add('hidden');

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

    }

    // CUSTOMER
    else {

        dashboardLink?.classList.remove('hidden');

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
                                onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image || ''}')"
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

function addToCart(id, name, price, image) {

    const existing = cart.find(item => item.id === id);

    if (existing) {

        existing.quantity++;

    } else {

        cart.push({
            id,
            name,
            price: parseFloat(price),
            image,
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

        container.innerHTML = notifications.map(notification => `
            <div class="p-4 border-b hover:bg-gray-50">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-sm">
                            ${notification.title || 'Notification'}
                        </p>

                        <p class="text-gray-600 text-sm mt-1">
                            ${notification.message || ''}
                        </p>

                        <p class="text-xs text-gray-400 mt-2">
                            ${new Date(notification.created_at)
                                .toLocaleString()}
                        </p>
                    </div>

                    ${
                        !notification.read_at
                            ? `<span class="w-2 h-2 bg-blue-500 rounded-full"></span>`
                            : ''
                    }
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load notifications', error);
    }
}
function updateNotificationBadge(count) {

    const badge =
        document.getElementById('notif-badge');

    if (!badge) return;

    if (count > 0) {

        badge.classList.remove('hidden');

        if (count > 9) {
            badge.textContent = '9+';
        } else {
            badge.textContent = count;
        }

        badge.classList.add(
            'bg-red-500',
            'text-white'
        );

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