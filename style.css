// --- S.R. Prime Mart E-Commerce Script ---

// Initial Products Data (Syncs across devices via LocalStorage)
let products = JSON.parse(localStorage.getItem('sr_admin_products')) || [
    {
        id: 1,
        name: "Men's Bar Neckpiece",
        category: "Accessories",
        price: 1200,
        stock: 15,
        image: "neckpiece.jpg",
        desc: "প্রিমিয়াম কোয়ালিটির স্টাইলিশ মেনস বার নেকপিস।"
    },
    {
        id: 2,
        name: "Men's Bar Bracelet",
        category: "Accessories",
        price: 850,
        stock: 20,
        image: "bracelet.jpg",
        desc: "আকর্ষণীয় ও টেকসই মেনস বার ব্রেসলেট।"
    }
];

if (!localStorage.getItem('sr_admin_products')) {
    localStorage.setItem('sr_admin_products', JSON.stringify(products));
}

let cart = JSON.parse(localStorage.getItem('sr_cart')) || [];
let orders = JSON.parse(localStorage.getItem('sr_orders')) || [];

// Render Products on Home Page
function renderProducts(productsToRender = products) {
    const container = document.getElementById('product-container');
    if (!container) return;
    container.innerHTML = '';

    if (productsToRender.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 40px;">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>`;
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="image-box-wrapper" onclick="openProductModal(${product.id})" style="cursor: pointer;">
                <div class="image-box">
                    <img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200'">
                </div>
            </div>
            <div class="product-category">${product.category || 'General'}</div>
            <div class="product-title" onclick="openProductModal(${product.id})" style="cursor: pointer;">${product.name}</div>
            <div class="price-buy-row" style="margin-top: 10px;">
                <div>
                    <span class="product-price">৳${product.price}</span>
                </div>
                <button class="buy-btn" onclick="addToCart(${product.id})">Buy</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Search Products
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
    renderProducts(filtered);
}

// Filter by Category
function filterByCategory(cat) {
    const filtered = products.filter(p => p.category.toLowerCase() === cat.toLowerCase());
    renderProducts(filtered);
}

// Product Details Modal
function openProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modalProductImg').src = product.image || 'https://via.placeholder.com/200';
    document.getElementById('modalCategory').innerText = product.category || 'General';
    document.getElementById('modalProductName').innerText = product.name;
    document.getElementById('modalProductPrice').innerText = `৳${product.price}`;
    document.getElementById('modalProductDesc').innerText = product.desc || 'প্রিমিয়াম কোয়ালিটির এই পণ্যটি অত্যন্ত স্টাইলিশ এবং টেকসই।';
    
    const addBtn = document.getElementById('modalAddToCartBtn');
    addBtn.onclick = function() {
        addToCart(product.id);
        closeProductModal();
    };

    document.getElementById('productDetailModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productDetailModal').style.display = 'none';
}

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    toggleCartDrawer(true);
}

function saveCart() {
    localStorage.setItem('sr_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const countSpan = document.getElementById('cartCount');
    const totalQtySub = document.getElementById('drawerItemHeaderSub');
    const itemsContainer = document.getElementById('drawerItemsContainer');
    const subtotalEl = document.getElementById('drawerSubtotal');
    const itemsTotalEl = document.getElementById('drawerItemsTotal');

    let totalCount = 0;
    let subtotal = 0;

    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';

    cart.forEach((item, index) => {
        totalCount += item.quantity;
        subtotal += item.price * item.quantity;

        const div = document.createElement('div');
        div.className = 'drawer-item-card';
        div.innerHTML = `
            <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;">
            <div style="flex: 1; margin-left: 12px;">
                <div style="font-size: 13px; font-weight: 600; color: #111827;">${item.name}</div>
                <div style="font-size: 12px; color: #27ae60; font-weight: 700;">৳${item.price}</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                    <button onclick="changeQty(${index}, -1)" style="padding: 2px 8px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">-</button>
                    <span style="font-size: 13px; font-weight: 600;">${item.quantity}</span>
                    <button onclick="changeQty(${index}, 1)" style="padding: 2px 8px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">+</button>
                </div>
            </div>
            <i class="fa-solid fa-trash" onclick="removeCartItem(${index})" style="color: #ef4444; cursor: pointer; font-size: 14px;"></i>
        `;
        itemsContainer.appendChild(div);
    });

    if (countSpan) countSpan.innerText = totalCount;
    if (totalQtySub) totalQtySub.innerText = `${totalCount} items`;
    if (subtotalEl) subtotalEl.innerText = `৳${subtotal}`;
    if (itemsTotalEl) itemsTotalEl.innerText = `৳${subtotal}`;
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
}

function removeCartItem(index) {
    cart.splice(index, 1);
    saveCart();
}

function toggleCartDrawer(open = false) {
    const drawer = document.getElementById('cartDrawer');
    if (!drawer) return;
    if (open || drawer.style.right === '0px') {
        drawer.style.right = drawer.style.right === '0px' ? '-400px' : '0px';
    } else {
        drawer.style.right = '0px';
    }
}

// Checkout & Orders
function openCheckoutModal() {
    if (cart.length === 0) {
        alert("আপনার কার্ট খালি!");
        return;
    }
    toggleCartDrawer();
    document.getElementById('checkoutModal').style.display = 'block';
    renderCheckoutSummary();
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function renderCheckoutSummary() {
    const list = document.getElementById('checkoutItemsList');
    if (!list) return;
    list.innerHTML = '';

    let subtotal = 0;
    let totalQty = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        totalQty += item.quantity;
        const div = document.createElement('div');
        div.style.cssText = "display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 13px;";
        div.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <span style="font-weight: 600;">৳${item.price * item.quantity}</span>
        `;
        list.appendChild(div);
    });

    document.getElementById('summaryTotalQty').innerText = totalQty;
    document.getElementById('modalSubtotal').innerText = `BDT ${subtotal}`;
    calculateFinalTotal();
}

function calculateFinalTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = parseInt(document.getElementById('deliveryLocation').value) || 70;
    const grandTotal = subtotal + deliveryFee;

    document.getElementById('modalDeliveryFee').innerText = `BDT ${deliveryFee}`;
    document.getElementById('modalGrandTotal').innerText = `BDT ${grandTotal}`;
}

// Place Order Form Submission
document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    updateCartUI();

    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('customerName').value;
            const email = document.getElementById('customerEmail').value;
            const phone = document.getElementById('customerPhone').value;
            const address = document.getElementById('customerAddress').value;
            const paymentMethod = document.querySelector('input[name="PaymentMethod"]:checked').value;
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const deliveryFee = parseInt(document.getElementById('deliveryLocation').value) || 70;
            const grandTotal = subtotal + deliveryFee;

            const newOrder = {
                id: 'SR-' + Math.floor(100000 + Math.random() * 900000),
                customer: { name, email, phone, address },
                items: [...cart],
                subtotal,
                deliveryFee,
                grandTotal,
                paymentMethod,
                status: 'Pending',
                date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            orders.unshift(newOrder);
            localStorage.setItem('sr_orders', JSON.stringify(orders));

            cart = [];
            saveCart();

            document.getElementById('successMessage').style.display = 'block';
            setTimeout(() => {
                closeCheckoutModal();
                document.getElementById('successMessage').style.display = 'none';
                orderForm.reset();
            }, 2500);
        };
    }

    const adminProductForm = document.getElementById('adminProductForm');
    if (adminProductForm) {
        adminProductForm.onsubmit = handleSaveProduct;
    }
});

// Admin Dashboard Management Functions
window.loadAdminDashboardData = function() {
    let totalRev = 0;
    orders.forEach(o => totalRev += o.grandTotal);

    document.getElementById('dashRevenue').innerText = `৳${totalRev}`;
    document.getElementById('dashOrdersCount').innerText = orders.length;
    document.getElementById('dashProductsCount').innerText = products.length;

    renderAdminOrdersTable();
    renderAdminInventoryTable();
    renderAdminProductManageList();
};

function renderAdminOrdersTable() {
    const tbody = document.getElementById('dashOrdersTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6b7280; padding: 20px;">No orders received yet.</td></tr>`;
        return;
    }

    orders.forEach((order, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${order.id}</strong></td>
            <td>${order.customer.name}<br><small>${order.customer.phone}</small></td>
            <td>${order.date}</td>
            <td>৳${order.grandTotal}</td>
            <td><span style="background: #eef2ff; color: #4f46e5; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${order.status}</span></td>
            <td>
                <button class="action-icon-btn" onclick="deleteOrder(${idx})" style="color: #ef4444;" title="Delete Order"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteOrder(idx) {
    if (confirm("আপনি কি এই অর্ডারটি ডিলিট করতে চান?")) {
        orders.splice(idx, 1);
        localStorage.setItem('sr_orders', JSON.stringify(orders));
        loadAdminDashboardData();
    }
}

function renderAdminInventoryTable() {
    const tbody = document.getElementById('dashInventoryTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div style="display: flex; align-items: center; gap: 10px;"><img src="${p.image}" style="width: 35px; height: 35px; object-fit: cover; border-radius: 4px;"><span>${p.name}</span></div></td>
            <td>${p.category || 'General'}</td>
            <td>৳${p.price}</td>
            <td><span style="font-weight: 700; color: ${p.stock <= 5 ? '#ef4444' : '#27ae60'};">${p.stock} units</span></td>
            <td>
                <input type="number" value="${p.stock}" style="width: 60px; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px;" onchange="quickUpdateStock(${idx}, this.value)">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function quickUpdateStock(idx, val) {
    products[idx].stock = parseInt(val) || 0;
    localStorage.setItem('sr_admin_products', JSON.stringify(products));
    renderProducts();
}

function renderAdminProductManageList() {
    const list = document.getElementById('adminProductManageList');
    if (!list) return;
    list.innerHTML = '';

    products.forEach((p, idx) => {
        const div = document.createElement('div');
        div.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px;";
        div.innerHTML = `
            <span>${p.name} (৳${p.price})</span>
            <div style="display: flex; gap: 8px;">
                <button onclick="editProduct(${idx})" style="background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Edit</button>
                <button onclick="deleteProduct(${idx})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });
}

let uploadedImageBase64 = "";

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            uploadedImageBase64 = event.target.result;
            const prevImg = document.getElementById('prevImg');
            if (prevImg) prevImg.src = uploadedImageBase64;
        };
        reader.readAsDataURL(file);
    }
}

function updateAdminPreview() {
    const name = document.getElementById('adminPName').value || 'Product Title';
    const price = document.getElementById('adminPPrice').value || '0';
    const cat = document.getElementById('adminPCategory').value || 'CATEGORY';

    document.getElementById('prevName').innerText = name;
    document.getElementById('prevPrice').innerText = `৳${price}`;
    document.getElementById('prevCategory').innerText = cat;
}

function handleSaveProduct(e) {
    e.preventDefault();
    const idField = document.getElementById('adminProductId').value;
    const name = document.getElementById('adminPName').value;
    const desc = document.getElementById('adminPDesc').value;
    const category = document.getElementById('adminPCategory').value;
    const stock = parseInt(document.getElementById('adminPStock').value) || 10;
    const price = parseFloat(document.getElementById('adminPPrice').value) || 0;

    const image = uploadedImageBase64 || (idField !== "" ? products[idField].image : "https://via.placeholder.com/200");

    if (idField !== "") {
        products[idField] = { id: products[idField].id, name, desc, category, stock, price, image };
    } else {
        const newId = products.length > 0 ? products[products.length - 1].id + 1 : 1;
        products.push({ id: newId, name, desc, category, stock, price, image });
    }

    localStorage.setItem('sr_admin_products', JSON.stringify(products));
    renderProducts();
    loadAdminDashboardData();
    resetAdminForm();
    alert("প্রডাক্ট সফলভাবে সেভ করা হয়েছে!");
}

function editProduct(idx) {
    const p = products[idx];
    document.getElementById('adminProductId').value = idx;
    document.getElementById('adminPName').value = p.name;
    document.getElementById('adminPDesc').value = p.desc || '';
    document.getElementById('adminPCategory').value = p.category || '';
    document.getElementById('adminPStock').value = p.stock;
    document.getElementById('adminPPrice').value = p.price;
    uploadedImageBase64 = p.image;
    document.getElementById('prevImg').src = p.image;
    updateAdminPreview();
}

function deleteProduct(idx) {
    if (confirm("আপনি কি এই প্রডাক্টটি মুছে ফেলতে চান?")) {
        products.splice(idx, 1);
        localStorage.setItem('sr_admin_products', JSON.stringify(products));
        renderProducts();
        loadAdminDashboardData();
    }
}

function resetAdminForm() {
    document.getElementById('adminProductForm').reset();
    document.getElementById('adminProductId').value = "";
    uploadedImageBase64 = "";
    document.getElementById('prevImg').src = "https://via.placeholder.com/200?text=Image+Preview";
}
