// State Management
const state = {
    products: [],
    cart: [],
    wishlist: new Set(),
    currentPage: 1,
    productsPerPage: 10,
    filters: {
        search: '',
        category: '',
        sort: 'default'
    }
};

// Cache DOM Elements
const elements = {
    productsContainer: document.getElementById('products-container'),
    searchInput: document.getElementById('search'),
    categorySelect: document.getElementById('category'),
    sortSelect: document.getElementById('sort'),
    paginationContainer: document.getElementById('pagination'),
    productInfoModal: document.getElementById('product-info-modal'),
    productInfoContent: document.getElementById('product-info-content'),
    cartModal: document.getElementById('cart-modal'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    cartCount: document.getElementById('cart-count'),
    cartBadge: document.getElementById('cart-badge'),
    toastContainer: document.getElementById('toast-container'),
    wishlistBadge: document.getElementById('wishlist-badge'),
    wishlistCount: document.getElementById('wishlist-count'),
    wishlistPage: document.getElementById('wishlist-page'),
    wishlistGrid: document.getElementById('wishlist-grid'),
    mainContent: document.getElementById('main-content')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing elements:', {
        sortSelect: elements.sortSelect,
        categorySelect: elements.categorySelect,
        searchInput: elements.searchInput
    });
    
    initialize();
    updateWishlistCount();
    
    // Add cart badge click event listener
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
        cartBadge.addEventListener('click', () => {
            console.log('Cart badge clicked'); // Debug log
            openCartModal();
        });
    }

    // Add close cart button event listener
    const closeCartButtons = document.querySelectorAll('.close-button');
    closeCartButtons.forEach(button => {
        button.addEventListener('click', closeCartModal);
    });

    // Verify sort select functionality
    if (elements.sortSelect) {
        elements.sortSelect.addEventListener('change', handleSortChange);
        console.log('Sort select event listener attached');
    } else {
        console.error('Sort select element not found');
    }
});

// Add keyboard event listener for ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        elements.productInfoModal.style.display = 'none';
        elements.cartModal.style.display = 'none';
        hideWishlistPage();
    }
});

// Initialize Application
async function initialize() {
    try {
        showLoading();
        await fetchProducts();
        populateCategories();
        renderProducts();
        hideLoading();
    } catch (error) {
        showError('Failed to initialize the application');
        console.error('Initialization error:', error);
    }
}

// API Functions
async function fetchProducts() {
    try {
        const response = await fetch('https://dummyjson.com/products?limit=100', {
            method: 'GET',
            mode: 'cors', // Enable CORS
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        state.products = data.products;
        return data.products;
    } catch (error) {
        console.error('Fetch error:', error);
        showError(`Failed to fetch products. Please check your internet connection and try again.
                  If the problem persists, try using a local server or the Live Server extension.`);
        return [];
    }
}

// Render Functions
function renderProducts() {
    const filteredProducts = filterProducts();
    const sortedProducts = sortProducts(filteredProducts);
    const paginatedProducts = paginateProducts(sortedProducts);
    
    elements.productsContainer.innerHTML = '';
    
    paginatedProducts.forEach(product => {
        const productElement = createProductElement(product);
        elements.productsContainer.appendChild(productElement);
    });

    updatePagination(sortedProducts.length);
}

function createProductElement(product) {
    const div = document.createElement('div');
    div.className = 'product';
    div.setAttribute('role', 'listitem');
    
    const isWishlisted = state.wishlist.has(product.id);
    
    div.innerHTML = `
        <div class="wishlist-icon ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(event, ${product.id})">
            <i class="fas fa-heart"></i>
        </div>
        <img src="${product.thumbnail}" alt="${product.title}" class="product-image" loading="lazy">
        <div class="product-info">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            ${product.discountPercentage > 0 ? `<span class="product-discount">-${Math.round(product.discountPercentage)}%</span>` : ''}
            <button class="add-to-cart-btn" onclick="addToCart(event, ${product.id})">
                <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
        </div>
    `;
    
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.wishlist-icon') && !e.target.closest('.add-to-cart-btn')) {
            displayProductInfo(product);
        }
    });
    
    return div;
}

// Filter and Sort Functions
function filterProducts() {
    return state.products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                            product.description.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                            product.category.toLowerCase().includes(state.filters.search.toLowerCase());
        
        const matchesCategory = !state.filters.category || product.category === state.filters.category;
        
        return matchesSearch && matchesCategory;
    });
}

function sortProducts(products) {
    const sortedProducts = [...products];
    console.log('Sorting products with:', state.filters.sort);
    
    switch (state.filters.sort) {
        case 'price-low':
            console.log('Sorting by price low to high');
            return sortedProducts.sort((a, b) => a.price - b.price);
        case 'price-high':
            console.log('Sorting by price high to low');
            return sortedProducts.sort((a, b) => b.price - a.price);
        case 'rating':
            console.log('Sorting by rating');
            return sortedProducts.sort((a, b) => b.rating - a.rating);
        default:
            console.log('Using default sort');
            return sortedProducts;
    }
}

function paginateProducts(products) {
    const startIndex = (state.currentPage - 1) * state.productsPerPage;
    const endIndex = startIndex + state.productsPerPage;
    return products.slice(startIndex, endIndex);
}

// Event Handlers
function handleSearch(event) {
    state.filters.search = event.target.value;
    state.currentPage = 1;
    renderProducts();
}

function handleFilterChange(event) {
    state.filters.category = event.target.value;
    state.currentPage = 1;
    renderProducts();
}

function handleSortChange(event) {
    console.log('Sort changed:', event.target.value);
    state.filters.sort = event.target.value;
    console.log('Current sort state:', state.filters.sort);
    renderProducts();
}

// Cart Functions
function addToCart(event, productId) {
    event.stopPropagation();
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }

    updateCartBadge();
    showToast(`Added ${product.title} to cart`);
}

function updateCartBadge() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
}

function openCartModal() {
    console.log('Opening cart modal'); // Debug log
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'flex';
        renderCart();
    }
}

function closeCartModal() {
    console.log('Closing cart modal'); // Debug log
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}

function renderCart() {
    if (!elements.cartItems) return;
    
    elements.cartItems.innerHTML = '';
    let total = 0;

    if (state.cart.length === 0) {
        elements.cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        elements.cartTotal.textContent = '0.00';
        return;
    }

    state.cart.forEach(item => {
        const product = state.products.find(p => p.id === item.id);
        if (!product) return;

        const itemTotal = product.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${product.title}</h4>
                <p class="cart-item-price">$${product.price.toFixed(2)}</p>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartItem(${product.id}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartItem(${product.id}, ${item.quantity + 1})">+</button>
                    <button class="remove-item" onclick="removeFromCart(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        elements.cartItems.appendChild(cartItem);
    });

    elements.cartTotal.textContent = total.toFixed(2);
}

function handleCheckout() {
    if (state.cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }

    // Calculate total items and amount
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Show success message
    showToast(`Order placed successfully! Total: $${totalAmount.toFixed(2)}`, 'success');

    // Clear cart
    state.cart = [];
    updateCartBadge();
    closeCartModal();

    // Show detailed confirmation
    const confirmationMessage = `
        <div class="modal" style="display: flex;">
            <div class="modal-content">
                <h2>Order Confirmation</h2>
                <p>Thank you for your purchase!</p>
                <div class="order-details">
                    <p>Items ordered: ${totalItems}</p>
                    <p>Total amount: $${totalAmount.toFixed(2)}</p>
                    <p>Order ID: ${generateOrderId()}</p>
                </div>
                <button class="checkout-btn" onclick="closeConfirmationModal()">
                    <i class="fas fa-check"></i>
                    Continue Shopping
                </button>
            </div>
        </div>
    `;
    
    const confirmationElement = document.createElement('div');
    confirmationElement.innerHTML = confirmationMessage;
    document.body.appendChild(confirmationElement);
}

function generateOrderId() {
    return 'ORD-' + Date.now().toString(36).toUpperCase();
}

function closeConfirmationModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    elements.toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function updateCartItem(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity = newQuantity;
        renderCart();
        updateCartBadge();
    }
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    renderCart();
    updateCartBadge();
    showToast('Item removed from cart');
}

// Wishlist Functions
function showWishlistPage() {
    elements.mainContent.style.display = 'none';
    elements.wishlistPage.style.display = 'block';
    renderWishlist();
    // Scroll to top when showing wishlist
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideWishlistPage() {
    elements.wishlistPage.style.display = 'none';
    elements.mainContent.style.display = 'block';
}

function renderWishlist() {
    const wishlistedProducts = state.products.filter(product => state.wishlist.has(product.id));
    elements.wishlistGrid.innerHTML = '';

    if (wishlistedProducts.length === 0) {
        elements.wishlistGrid.innerHTML = `
            <div class="empty-wishlist">
                <i class="fas fa-heart-broken"></i>
                <p>Your wishlist is empty</p>
                <p>Add items to your wishlist by clicking the heart icon on products</p>
                <button class="continue-shopping-btn" onclick="hideWishlistPage()">
                    <i class="fas fa-shopping-bag"></i>
                    Start Shopping
                </button>
            </div>
        `;
    } else {
        wishlistedProducts.forEach(product => {
            const productElement = createProductElement(product);
            elements.wishlistGrid.appendChild(productElement);
        });
    }

    // Update wishlist count
    updateWishlistCount();
}

function updateWishlistCount() {
    const count = state.wishlist.size;
    elements.wishlistCount.textContent = count;
    const wishlistCountDisplay = document.querySelector('.wishlist-count');
    if (wishlistCountDisplay) {
        wishlistCountDisplay.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }
}

function toggleWishlist(event, productId) {
    event.stopPropagation();
    if (state.wishlist.has(productId)) {
        state.wishlist.delete(productId);
        showToast('Removed from wishlist', 'error');
    } else {
        state.wishlist.add(productId);
        showToast('Added to wishlist', 'success');
    }
    updateWishlistCount();
    
    // Update the display based on current view
    if (elements.wishlistPage.style.display === 'block') {
        renderWishlist();
    } else {
        renderProducts();
    }
}

// Modal Functions
function displayProductInfo(product) {
    if (!elements.productInfoModal || !elements.productInfoContent) return;

    elements.productInfoContent.innerHTML = `
        <button id="close-modal" class="close-button" aria-label="Close modal">
            <i class="fas fa-times"></i>
        </button>
        <div class="product-details">
            <h2 id="modal-title">${product.title}</h2>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            ${product.discountPercentage > 0 ? `<p class="product-discount">-${Math.round(product.discountPercentage)}% OFF</p>` : ''}
            <p>Brand: ${product.brand}</p>
            <p>Rating: ${product.rating} ⭐</p>
            <p>Stock: ${product.stock}</p>
            <h3>Description:</h3>
            <p>${product.description}</p>
            <div class="product-actions">
                <button class="add-to-cart-btn" onclick="addToCart(event, ${product.id})">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
        <div class="gallery">
            ${product.images.map(image => `
                <img src="${image}" alt="${product.title}" class="gallery-image" onclick="openFullSizeImage('${image}')">
            `).join('')}
        </div>
    `;

    elements.productInfoModal.style.display = 'flex';
    
    // Add event listeners for closing the modal
    const closeButton = document.getElementById('close-modal');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            elements.productInfoModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    elements.productInfoModal.addEventListener('click', (e) => {
        if (e.target === elements.productInfoModal) {
            elements.productInfoModal.style.display = 'none';
        }
    });
}

// Utility Functions
function populateCategories() {
    const categories = [...new Set(state.products.map(product => product.category))];
    const optionList = categories.map(category => 
        `<option value="${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</option>`
    ).join('');
    elements.categorySelect.innerHTML = `<option value="">All Categories</option>${optionList}`;
}

function updatePagination(totalProducts) {
    const totalPages = Math.ceil(totalProducts / state.productsPerPage);
    
    elements.paginationContainer.innerHTML = `
        ${state.currentPage > 1 ? `<button onclick="changePage(${state.currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>` : ''}
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
            <button class="${page === state.currentPage ? 'active' : ''}" 
                    onclick="changePage(${page})">${page}</button>
        `).join('')}
        ${state.currentPage < totalPages ? `<button onclick="changePage(${state.currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>` : ''}
    `;
}

function changePage(page) {
    state.currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loading-spinner';
    elements.productsContainer.innerHTML = '';
    elements.productsContainer.appendChild(loader);
}

function hideLoading() {
    const loader = elements.productsContainer.querySelector('.loading-spinner');
    if (loader) loader.remove();
}

function showError(message) {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error Loading Products</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="retry-btn">
            <i class="fas fa-redo"></i> Retry
        </button>
    `;
    elements.productsContainer.innerHTML = '';
    elements.productsContainer.appendChild(error);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function openFullSizeImage(imageUrl) {
    window.open(imageUrl, '_blank');
}

// Add styles for error message
const style = document.createElement('style');
style.textContent = `
    .error-message {
        text-align: center;
        padding: 2rem;
        background: #fff3f3;
        border-radius: 10px;
        margin: 2rem auto;
        max-width: 600px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }

    .error-message i {
        font-size: 3rem;
        color: #e74c3c;
        margin-bottom: 1rem;
    }

    .error-message h3 {
        color: #e74c3c;
        margin-bottom: 1rem;
        font-size: 1.5rem;
    }

    .error-message p {
        color: #7f8c8d;
        margin-bottom: 1.5rem;
        line-height: 1.6;
    }

    .retry-btn {
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 25px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .retry-btn:hover {
        background: linear-gradient(135deg, #2980b9, #2475a7);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
    }
`;
document.head.appendChild(style);


