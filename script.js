// ডিফল্ট কাজ করার মতো অনলাইন ইমেজ লিংক
const defaultProducts = [
    {
        id: 1,
        name: "Men's Bar Bracelet",
        price: 200,
        description: "High quality stylish bar bracelet for everyday use.",
        image: "https://images.unsplash.com/photo-1611591475179-42b78a9c3fb4?w=500&auto=format&fit=crop"
    },
    {
        id: 2,
        name: "Luxury Islamic Ayatul Kursi Cuff Bracelet",
        price: 200,
        description: "Elegant Ayatul Kursi engraved cuff bracelet.",
        image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop"
    }
];

// ব্রাউজারের পুরোনো ব্রোকেন ডেটা ক্লিয়ার করে ফ্রেশ ডেটা রেন্ডার করা
let stored = localStorage.getItem('sr_products_v2');
let products = stored ? JSON.parse(stored) : defaultProducts;
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    saveProductsToStorage();
    renderProducts(products);
    updateCartUI();
});

function saveProductsToStorage() {
    localStorage.setItem('sr_products_v2', JSON.stringify(products));
}

// প্রোডাক্ট রেন্ডার ফাংশন
function renderProducts(items) {
    const container = document.getElementById('product-container');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">No products available!</p>`;
        return;
    }

    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div>
                <div class="image-box" onclick="openProductModal(${product.id})" title="Click for details">
                    <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/200?text=SR+Prime+Mart';">
                </div>
                <div class="product-title" onclick="openProductModal(${product.id})">${product.name}</div>
                <div class="price-buy-row">
                    <span class="product-price">৳${product.price}</span>
                    <button class="buy-btn" onclick="openProductModal(${product.id})">Buy</button>
                </div>
            </div>
        </div>
    `).join('');
}

// প্রোডাক্ট সার্চ ফাংশন
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filtered);
}

// কার্টে প্রোডাক্ট যোগ করা
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

function decreaseQty(productId) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
    }
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    updateCartUI();
}

function toggleCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    if (drawer) drawer.classList.toggle('open');
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const drawerItemsContainer = document.getElementById('drawerItemsContainer');
    const drawerSubtotal = document.getElementById('drawerSubtotal');
    const drawerItemsTotal = document.getElementById('drawerItemsTotal');
    const drawerItemHeaderSub = document.getElementById('drawerItemHeaderSub');

    let totalCount = 0;
    let subtotal = 0;

    cart.forEach(item => {
        totalCount += item.quantity;
        subtotal += item.price * item.quantity;
    });

    if (cartCount) cartCount.innerText = totalCount;
    if (drawerItemHeaderSub) drawerItemHeaderSub.innerText = `${totalCount} items`;
    if (drawerSubtotal) drawerSubtotal.innerText = `৳${subtotal}`;
    if (drawerItemsTotal) drawerItemsTotal.innerText = `৳${subtotal}`;

    if (drawerItemsContainer) {
        if (cart.length === 0) {
            drawerItemsContainer.innerHTML = `<p style="text-align: center; color: #888; margin-top: 40px;">Your cart is empty</p>`;
        } else {
            drawerItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item-card">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/60';">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-bottom">
                            <span class="cart-item-price">৳${item.price}</span>
                            <div class="cart-qty-controls">
                                <button class="q-btn" onclick="decreaseQty(${item.id})">-</button>
                                <span>${item.quantity}</span>
                                <button class="q-btn" onclick="addToCart(${item.id})">+</button>
                                <i class="fa-solid fa-trash-can delete-btn" onclick="removeFromCart(${item.id})"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    updateCheckoutUI(subtotal, totalCount);
}

function openCheckoutModal() {
    if (cart.length === 0) {
        alert('আপনার কার্ট খালি!');
        return;
    }
    toggleCartDrawer();
    document.getElementById('checkoutModal').style.display = 'block';
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function updateCheckoutUI(subtotal, totalCount) {
    const checkoutItemsList = document.getElementById('checkoutItemsList');
    const summaryTotalQty = document.getElementById('summaryTotalQty');
    const modalSubtotal = document.getElementById('modalSubtotal');
    
    if (summaryTotalQty) summaryTotalQty.innerText = totalCount;
    if (modalSubtotal) modalSubtotal.innerText = `BDT ${subtotal}`;

    if (checkoutItemsList) {
        checkoutItemsList.innerHTML = cart.map(item => `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
                <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" onerror="this.src='https://via.placeholder.com/50';">
                <div style="flex-grow: 1;">
                    <div style="font-size: 13px; font-weight: 500; color: #1f2937;">${item.name}</div>
                    <div style="font-size: 12px; color: #6b7280;">BDT ${item.price} × ${item.quantity}</div>
                </div>
                <div style="font-weight: 700; font-size: 13px; color: #000000;">BDT ${item.price * item.quantity}</div>
            </div>
        `).join('');
    }

    calculateFinalTotal();
}

function calculateFinalTotal() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliverySelect = document.getElementById('deliveryLocation');
    const deliveryFee = deliverySelect ? parseInt(deliverySelect.value) : 70;

    const modalDeliveryFee = document.getElementById('modalDeliveryFee');
    const modalGrandTotal = document.getElementById('modalGrandTotal');

    if (modalDeliveryFee) modalDeliveryFee.innerText = `BDT ${deliveryFee}`;
    if (modalGrandTotal) modalGrandTotal.innerText = `BDT ${subtotal + deliveryFee}`;
}

// প্রোডাক্ট ডিটেইলস মোডাল
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modalProductImg').src = product.image;
    document.getElementById('modalProductName').innerText = product.name;
    document.getElementById('modalProductPrice').innerText = `৳${product.price}`;
    document.getElementById('modalProductDesc').innerText = product.description || "প্রিমিয়াম কোয়ালিটির এই পণ্যটি অত্যন্ত স্টাইলিশ এবং টেকসই।";
    
    const modalBtn = document.getElementById('modalAddToCartBtn');
    modalBtn.onclick = function() {
        addToCart(product.id);
        closeProductModal();
        toggleCartDrawer(); 
    };

    document.getElementById('productDetailModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productDetailModal').style.display = 'none';
}

/* ============================================================
   ADMIN SYSTEM FUNCTIONS
   ============================================================ */

function openAdminAuthModal() {
    document.getElementById('adminAuthModal').style.display = 'block';
}

function closeAdminAuthModal() {
    document.getElementById('adminAuthModal').style.display = 'none';
}

function verifyAdminPassword() {
    const pass = document.getElementById('adminPassInput').value;
    if (pass === '1234') { 
        closeAdminAuthModal();
        document.getElementById('adminPassInput').value = '';
        openAdminDashboard();
    } else {
        alert('Incorrect Password!');
    }
}

function openAdminDashboard() {
    document.getElementById('adminDashboardModal').style.display = 'block';
    renderAdminProductManageList();
}

function closeAdminDashboard() {
    document.getElementById('adminDashboardModal').style.display = 'none';
}

function updateAdminPreview() {
    const name = document.getElementById('adminPName').value || 'Product Title';
    const price = document.getElementById('adminPPrice').value || '0.00';
    const image = document.getElementById('adminPImage').value || 'https://via.placeholder.com/200?text=Image+Preview';

    document.getElementById('prevName').innerText = name;
    document.getElementById('prevPrice').innerText = `৳${price}`;
    document.getElementById('prevImg').src = image;
}

function handleSaveProduct(e) {
    e.preventDefault();

    const idInput = document.getElementById('adminProductId').value;
    const name = document.getElementById('adminPName').value;
    const price = parseFloat(document.getElementById('adminPPrice').value);
    const description = document.getElementById('adminPDesc').value;
    const image = document.getElementById('adminPImage').value;

    if (idInput) {
        const index = products.findIndex(p => p.id == idInput);
        if (index !== -1) {
            products[index] = { ...products[index], name, price, description, image };
        }
    } else {
        const newProduct = {
            id: Date.now(),
            name,
            price,
            description,
            image
        };
        products.push(newProduct);
    }

    saveProductsToStorage();
    renderProducts(products);
    renderAdminProductManageList();
    resetAdminForm();
    alert('✅ Product saved successfully!');
}

function editProductInAdmin(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('adminProductId').value = product.id;
    document.getElementById('adminPName').value = product.name;
    document.getElementById('adminPPrice').value = product.price;
    document.getElementById('adminPDesc').value = product.description || '';
    document.getElementById('adminPImage').value = product.image;

    document.getElementById('adminFormTitle').innerText = 'Edit Product';
    updateAdminPreview();
}

function deleteProductInAdmin(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== productId);
        saveProductsToStorage();
        renderProducts(products);
        renderAdminProductManageList();
    }
}

function resetAdminForm() {
    document.getElementById('adminProductForm').reset();
    document.getElementById('adminProductId').value = '';
    document.getElementById('adminFormTitle').innerText = 'Add / Edit product';
    updateAdminPreview();
}

function renderAdminProductManageList() {
    const container = document.getElementById('adminProductManageList');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `<p style="color: #888;">No products to manage.</p>`;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="admin-prod-item">
            <span><strong>${product.name}</strong> (৳${product.price})</span>
            <div>
                <button onclick="editProductInAdmin(${product.id})" style="background: none; border: none; color: #27ae60; cursor: pointer; margin-right: 10px; font-weight: 600;">Edit</button>
                <button onclick="deleteProductInAdmin(${product.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: 600;">Delete</button>
            </div>
        </div>
    `).join('');
}

// অর্ডার সাবমিট
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');

        if (submitBtn) submitBtn.style.display = 'none';
        if (successMessage) successMessage.style.display = 'block';

        setTimeout(() => {
            cart = [];
            updateCartUI();
            if (submitBtn) submitBtn.style.display = 'block';
            if (successMessage) successMessage.style.display = 'none';
            closeCheckoutModal();
        }, 4000);
    });
}
