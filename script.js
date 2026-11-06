// প্রোডাক্ট লিস্ট
const products = [
    {
        id: 1,
        name: "Men's Bar Bracelet",
        price: 200,
        image: "bracelet.jpg" // বা আপনার প্রোডাক্টের ছবির নাম
    },
    {
        id: 2,
        name: "Luxury Islamic Ayatul Kursi Cuff Bracelet",
        price: 200,
        image: "cuff.jpg" // বা আপনার প্রোডাক্টের ছবির নাম
    }
];

// কার্ট বা শপিং ব্যাগ ডাটা
let cart = [];

// পেজ লোড হলে প্রোডাক্ট রেন্ডার করা
document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
    updateCartUI();
});

// প্রোডাক্ট স্ক্রিনে শো করার ফাংশন (ছবির ওপর ক্লিক করলে ডিটেইলস পপআপ আসবে)
function renderProducts(items) {
    const container = document.getElementById('product-container');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">No products found!</p>`;
        return;
    }

    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div>
                <!-- ছবির ওপর ক্লিক করলে ডিটেইলস পপআপ আসবে -->
                <div class="image-box" onclick="openProductModal(${product.id})" title="Click for details" style="cursor: pointer;">
                    <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/200?text=Product+Image';">
                </div>
                <div class="product-title" onclick="openProductModal(${product.id})" style="cursor: pointer;" title="Click for details">${product.name}</div>
                <div class="price-stock-row">
                    <span class="product-price">৳${product.price}</span>
                    <span class="stock-badge">In stock</span>
                </div>
            </div>
            <button class="add-cart-btn" onclick="addToCart(${product.id})">
                <i class="fa-solid fa-cart-plus"></i> Add to cart
            </button>
        </div>
    `).join('');
}

// প্রোডাক্ট সার্চ ফাংশন
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filtered);
}

// কার্টে প্রোডাক্ট যোগ করার ফাংশন
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

// কার্টের পরিমাণ কমানো
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

// কার্ট থেকে আইটেম রিমোভ করা
function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    updateCartUI();
}

// কার্ট ড্রয়ার ওপেন/ক্লোজ টগল
function toggleCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    if (drawer) {
        drawer.classList.toggle('open');
    }
}

// কার্টের ইউআই এবং ক্যালকুলেশন আপডেট করা
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

    // চেকআউট পেজের আইটেম লিস্ট আপডেট করা
    updateCheckoutUI(subtotal, totalCount);
}

// চেকআউট মোডাল ওপেন/ক্লোজ করা
function openCheckoutModal() {
    if (cart.length === 0) {
        alert('আপনার কার্ট খালি! দয়া করে প্রথমে কিছু কার্টে যোগ করুন।');
        return;
    }
    toggleCartDrawer();
    document.getElementById('checkoutModal').style.display = 'block';
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

// চেকআউট পেজের আইটেম ও টোটাল হিসাব আপডেট করা
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

// ডেলিভারি চার্জ সহ গ্র্যান্ড টোটাল হিসাব করা
function calculateFinalTotal() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliverySelect = document.getElementById('deliveryLocation');
    const deliveryFee = deliverySelect ? parseInt(deliverySelect.value) : 70;

    const modalDeliveryFee = document.getElementById('modalDeliveryFee');
    const modalGrandTotal = document.getElementById('modalGrandTotal');

    if (modalDeliveryFee) modalDeliveryFee.innerText = `BDT ${deliveryFee}`;
    if (modalGrandTotal) modalGrandTotal.innerText = `BDT ${subtotal + deliveryFee}`;
}

// ---- নতুন ফিচার: প্রোডাক্ট ডিটেইলস মোডাল ওপেন/ক্লোজ ফাংশন ----
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modalProductImg').src = product.image;
    document.getElementById('modalProductName').innerText = product.name;
    document.getElementById('modalProductPrice').innerText = `৳${product.price}`;
    
    // মোডালের এড টু কার্ট বাটন সেটআপ
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

// অর্ডার ফর্ম সাবমিট হ্যান্ডলার
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');

        if (submitBtn) submitBtn.style.display = 'none';
        if (successMessage) successMessage.style.display = 'block';

        // ৩ সেকেন্ড পর কার্ট খালি করে মোডাল বন্ধ করা
        setTimeout(() => {
            cart = [];
            updateCartUI();
            if (submitBtn) submitBtn.style.display = 'block';
            if (successMessage) successMessage.style.display = 'none';
            closeCheckoutModal();
        }, 4000);
    });
}
