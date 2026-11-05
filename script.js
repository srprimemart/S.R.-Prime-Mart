const scriptURL = 'https://script.google.com/macros/s/AKfycbxYNeAUNdXYcUaAeNupvRyoiARb1PGC8au94ZYQzBysMkIop2txBsloRx9C62BDARIF/exec';

const products = [
    {
        id: 1,
        name: "Men's Bar Neckpiece",
        price: 180,
        image: "b2.jpg"
    },
    {
        id: 2,
        name: "Men's Bar Bracelet",
        price: 200,
        image: "b1.jpg"
    },
    {
        id: 3,
        name: "Luxury Islamic Ayatul Kursi Cuff Bracelet",
        price: 200,
        image: "b3.jpg"
    },
    {
        id: 4,
        name: "Watch",
        price: 2500,
        image: "b4.jpg"
    }
];

let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
});

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
                <div class="image-box">
                    <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/200?text=Product+Image';">
                </div>
                <div class="product-title">${product.name}</div>
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

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filtered);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    toggleCartDrawer();
}

function increaseQty(productId) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += 1;
        updateCartUI();
    }
}

function decreaseQty(productId) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        updateCartUI();
    }
}

function updateCartUI() {
    // মোট কোয়ান্টিটি সঠিক হিসাব (Sum of item quantities)
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartBadge = document.getElementById('cartCount');
    const summaryTotalQty = document.getElementById('summaryTotalQty');
    
    if (cartBadge) cartBadge.innerText = totalCount;
    if (summaryTotalQty) summaryTotalQty.innerText = totalCount; // কোয়ান্টিটি সঠিকভাবে আপডেট হবে

    const drawerContainer = document.getElementById('drawerItemsContainer');
    const checkoutListContainer = document.getElementById('checkoutItemsList');

    if (cart.length === 0) {
        if (drawerContainer) drawerContainer.innerHTML = `<p style="text-align: center; color: #6b7280; padding: 20px;">Your cart is empty!</p>`;
        if (checkoutListContainer) checkoutListContainer.innerHTML = `<p style="text-align: center; color: #6b7280; padding: 15px;">Cart is empty</p>`;
        
        document.getElementById('drawerSubtotal').innerText = `BDT 0`;
        if (document.getElementById('modalSubtotal')) document.getElementById('modalSubtotal').innerText = `BDT 0`;
        if (document.getElementById('modalGrandTotal')) document.getElementById('modalGrandTotal').innerText = `BDT 0`;
        return;
    }

    if (drawerContainer) {
        drawerContainer.innerHTML = cart.map(item => `
            <div class="cart-item-row">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/50';">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">BDT ${item.price}</div>
                    <div class="qty-box">
                        <button class="q-btn" onclick="decreaseQty(${item.id})">-</button>
                        <span>${item.quantity}</span>
                        <button class="q-btn" onclick="increaseQty(${item.id})">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    if (checkoutListContainer) {
        checkoutListContainer.innerHTML = cart.map(item => `
            <div class="cart-item-row">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/50';">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">BDT ${item.price} × ${item.quantity}</div>
                    <div class="qty-box">
                        <button class="q-btn" onclick="decreaseQty(${item.id})">-</button>
                        <span>${item.quantity}</span>
                        <button class="q-btn" onclick="increaseQty(${item.id})">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('drawerSubtotal').innerText = `BDT ${subtotal}`;
    if (document.getElementById('modalSubtotal')) document.getElementById('modalSubtotal').innerText = `BDT ${subtotal}`;

    calculateFinalTotal();
}

function calculateFinalTotal() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliverySelect = document.getElementById('deliveryLocation');
    let deliveryFee = deliverySelect ? parseInt(deliverySelect.value) : 70;

    if (document.getElementById('modalDeliveryFee')) {
        document.getElementById('modalDeliveryFee').innerText = `BDT ${deliveryFee}`;
    }

    let grandTotal = subtotal > 0 ? subtotal + deliveryFee : 0;
    if (document.getElementById('modalGrandTotal')) {
        document.getElementById('modalGrandTotal').innerText = `BDT ${grandTotal}`;
    }
}

function toggleCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    if (drawer) {
        drawer.classList.toggle('open');
    }
}

function openCheckoutModal() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    const drawer = document.getElementById('cartDrawer');
    if (drawer) drawer.classList.remove('open');
    
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.style.display = 'block';
        calculateFinalTotal();
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const msg = document.getElementById('successMessage');
    if (msg) {
        msg.style.display = 'none';
    }
}

const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        let orderSummaryText = cart.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ');
        let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let deliveryFee = parseInt(document.getElementById('deliveryLocation').value);
        let totalAmount = subtotal + deliveryFee;

        let formData = new FormData(orderForm);
        formData.append('ProductDetails', orderSummaryText);
        formData.append('TotalAmount', `BDT ${totalAmount}`);

        fetch(scriptURL, { method: 'POST', body: formData })
            .then(response => showSuccess())
            .catch(error => showSuccess());

        function showSuccess() {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Place Order';
            orderForm.reset();
            cart = [];
            updateCartUI();
            
            if (successMessage) {
                successMessage.style.display = 'block';
            }
            
            setTimeout(() => {
                closeCheckoutModal();
            }, 6000);
        }
    });
}
