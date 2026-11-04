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

let cartItemCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
});

// প্রোডাক্ট গ্রিডে শো করা
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
            <button class="add-cart-btn" onclick="addToCart('${product.name.replace(/'/g, "\\'")}', ${product.price})">
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

// কার্টে প্রোডাক্ট যোগ ও মডাল ওপেন
function addToCart(productName, price) {
    cartItemCount++;
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        cartBadge.innerText = cartItemCount;
    }
    
    const productInput = document.getElementById('selectedProduct');
    if (productInput) {
        productInput.value = `${productName} - ৳${price}`;
    }

    openCart();
}

// মডাল কন্ট্রোল
function openCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const msg = document.getElementById('successMessage');
    if (msg) {
        msg.style.display = 'none';
    }
}

// অর্ডার ফর্ম সাবমিশন
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');

        submitBtn.disabled = true;
        submitBtn.textContent = 'প্রসেসিং হচ্ছে...';

        const formData = new FormData(orderForm);

        fetch(scriptURL, { method: 'POST', body: formData })
            .then(response => showSuccess())
            .catch(error => showSuccess());

        function showSuccess() {
            submitBtn.disabled = false;
            submitBtn.textContent = 'অর্ডার কনফার্ম করুন';
            orderForm.reset();
            if (successMessage) {
                successMessage.style.display = 'block';
            }
            
            setTimeout(() => {
                closeCart();
            }, 3000);
        }
    });
}
