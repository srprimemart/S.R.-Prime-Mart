
// Google Apps Script URL
const scriptURL = 'https://script.google.com/macros/s/AKfycbxYNeAUNdXYcUaAeNupvRyoiARb1PGC8au94ZYQzBysMkIop2txBsloRx9C62BDARIF/exec';

// প্রোডাক্টের তালিকা
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

// কার্ট অ্যারে (যেখানে প্রোডাক্টগুলো জমা হবে)
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
});

// প্রোডাক্ট রেন্ডার করা
function renderProducts(items) {
    const container = document.getElementById('product-container');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">কোনো প্রোডাক্ট পাওয়া যায়নি!</p>`;
        return;
    }

    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div>
                <div class="image-box">
                    <img src="${product.image}" alt="${product.name}">
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

// সার্চ ফাংশন
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
    openCartModal();
}

// কোয়ান্টিটি বাড়ানো (+১)
function increaseQty(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += 1;
        updateCartUI();
    }
}

// কোয়ান্টিটি কমানো (-১)
function decreaseQty(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        updateCartUI();
    }
}

// কার্টের UI এবং টোটাল আপডেট করা
function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        cartBadge.innerText = totalCount;
    }

    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #6b7280; padding: 20px;">আপনার কার্টটি খালি!</p>`;
        document.getElementById('subTotal').innerText = `৳0`;
        document.getElementById('grandTotal').innerText = `৳0`;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item-card">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">৳${item.price} × ${item.quantity}</div>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="decreaseQty(${item.id})">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="increaseQty(${item.id})">+</button>
                </div>
            </div>
        </div>
    `).join('');

    updateTotal();
}

// সাবটোটাল ও ডেলিভারি চার্জ হিসাব করা
function updateTotal() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliverySelect = document.getElementById('deliveryLocation');
    let deliveryFee = deliverySelect ? parseInt(deliverySelect.value) : 170;

    document.getElementById('subTotal').innerText = `৳${subtotal}`;
    document.getElementById('deliveryCharge').innerText = `৳${deliveryFee}`;
    
    let grandTotal = subtotal > 0 ? subtotal + deliveryFee : 0;
    document.getElementById('grandTotal').innerText = `৳${grandTotal}`;
}

// মডাল ওপেন ও ক্লোজ
function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'flex';
        updateCartUI();
    }
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const msg = document.getElementById('successMessage');
    if (msg) {
        msg.style.display = 'none';
    }
}

// অর্ডার সাবমিট করা
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (cart.length === 0) {
            alert('আপনার কার্টে কোনো প্রোডাক্ট নেই!');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');

        submitBtn.disabled = true;
        submitBtn.textContent = 'প্রসেসিং হচ্ছে...';

        // কার্টের সব প্রোডাক্টের বিবরণ একসাথে তৈরি করা
        let orderSummaryText = cart.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ');
        let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let deliveryFee = parseInt(document.getElementById('deliveryLocation').value);
        let totalAmount = subtotal + deliveryFee;

        let formData = new FormData(orderForm);
        formData.append('ProductDetails', orderSummaryText);
        formData.append('TotalAmount', `৳${totalAmount}`);

        fetch(scriptURL, { method: 'POST', body: formData })
            .then(response => showSuccess())
            .catch(error => showSuccess());

        function showSuccess() {
            submitBtn.disabled = false;
            submitBtn.textContent = 'പ്লেস অর্ডার (Place Order)';
            orderForm.reset();
            cart = [];
            updateCartUI();
            
            if (successMessage) {
                successMessage.style.display = 'block';
            }
            
            setTimeout(() => {
                closeCartModal();
            }, 4000);
        }
    });
}
