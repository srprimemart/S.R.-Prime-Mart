// --- S.R. Prime Mart Master Script ---

const ADMIN_EMAIL = "srprimemart2026@gmail.com";
const ADMIN_MASTER_KEY = "1234";

let loggedInUser = JSON.parse(localStorage.getItem('sr_customer_user')) || null;

let defaultProducts = [
    {
        id: 1,
        name: "Men's Bar Neckpiece",
        price: 1200,
        stock: 15,
        images: ["b2.jpg"],
        desc: "প্রিমিয়াম কোয়ালিটির স্টাইলিশ মেনস বার নেকপিস।"
    },
    {
        id: 2,
        name: "Men's Bar Bracelet",
        price: 850,
        stock: 20,
        images: ["b3.jpg"],
        desc: "আকর্ষণীয় ও টেকসই মেনস বার ব্রেসলেট।"
    }
];

let rawProducts = JSON.parse(localStorage.getItem('sr_admin_products')) || defaultProducts;
let products = rawProducts.map(p => ({
    ...p,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : ["https://via.placeholder.com/300"])
}));

let cart = JSON.parse(localStorage.getItem('sr_cart')) || [];
let orders = JSON.parse(localStorage.getItem('sr_orders')) || [];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('custModalEmail');
    const adminSecContainer = document.getElementById('adminSecKeyContainer');
    if (emailInput && adminSecContainer) {
        emailInput.addEventListener('input', function() {
            adminSecContainer.style.display = (this.value.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? 'block' : 'none';
        });
    }

    updateUIForCustomer();
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
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const deliveryFee = parseInt(document.getElementById('deliveryLocation').value) || 70;

            orders.unshift({
                id: 'SR-' + Math.floor(100000 + Math.random() * 900000),
                customer: { name, email, phone, address },
                items: [...cart],
                grandTotal: subtotal + deliveryFee,
                status: 'Pending'
            });
            localStorage.setItem('sr_orders', JSON.stringify(orders));

            cart = [];
            saveCart();

            document.getElementById('successMessage').style.display = 'block';
            setTimeout(() => {
                closeCheckoutModal();
                document.getElementById('successMessage').style.display = 'none';
                orderForm.reset();
            }, 2000);
        };
    }
});

// Authentication & UI State
function updateUIForCustomer() {
    const authText = document.getElementById('userAuthText');
    const authBtn = document.getElementById('userAuthBtn');
    const adminTopBtn = document.getElementById('adminPanelTopBtn');

    if (loggedInUser && loggedInUser.email) {
        let displayName = loggedInUser.email.split('@')[0];
        if (displayName.length > 10) displayName = displayName.substring(0, 8) + '...';
        authText.innerText = displayName;
        authBtn.onclick = handleCustomerLogout;
        if (adminTopBtn) {
            adminTopBtn.style.display = (loggedInUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? 'inline-block' : 'none';
        }
    } else {
        authText.innerText = 'Login';
        authBtn.onclick = openCustomerAuthModal;
        if (adminTopBtn) adminTopBtn.style.display = 'none';
    }
}

function openCustomerAuthModal() { document.getElementById('customerAuthModal').style.display = 'block'; }
function closeCustomerAuthModal() { document.getElementById('customerAuthModal').style.display = 'none'; }

function handleCustomerEmailLogin(e) {
    e.preventDefault();
    const email = document.getElementById('custModalEmail').value.trim();
    const secKey = document.getElementById('adminSecKeyInput').value;

    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        if (secKey !== ADMIN_MASTER_KEY) {
            alert("ভুল অ্যাডমিন সিকিউরিটি কোড!");
            return;
        }
        loggedInUser = { email: email, provider: 'Admin' };
        localStorage.setItem('sr_customer_user', JSON.stringify(loggedInUser));
        updateUIForCustomer();
        closeCustomerAuthModal();
        openAdminDashboardFromTop();
    } else {
        loggedInUser = { email: email, provider: 'Email' };
        localStorage.setItem('sr_customer_user', JSON.stringify(loggedInUser));
        updateUIForCustomer();
        closeCustomerAuthModal();
    }
}

function handleCustomerLogout() {
    if (confirm("লগআউট করতে চান?")) {
        loggedInUser = null;
        localStorage.removeItem('sr_customer_user');
        updateUIForCustomer();
    }
}

// Render Storefront Products
function renderProducts(productsToRender = products) {
    const container = document.getElementById('product-container');
    if (!container) return;
    container.innerHTML = '';

    if (productsToRender.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 40px;">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>`;
        return;
    }

    productsToRender.forEach(product => {
        const mainImg = product.images[0] || 'https://via.placeholder.com/300';
        const photoCountBadge = product.images.length > 1 
            ? `<span class="multi-img-badge"><i class="fa-regular fa-images"></i> ${product.images.length} Photos</span>` 
            : '';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div onclick="openProductModal(${product.id})" style="cursor: pointer; padding: 12px 12px 0 12px;">
                <div class="image-box">
                    <img src="${mainImg}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300'">
                    ${photoCountBadge}
                </div>
            </div>
            <div style="padding: 14px 16px 0 16px;">
                <div onclick="openProductModal(${product.id})" style="font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 12px; cursor: pointer;">${product.name}</div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 17px; font-weight: 800; color: #111827;">৳${product.price}</span>
                    <button class="buy-btn" onclick="addToCart(${product.id})">Buy</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filtered);
}

// Product Details Modal (4-Photo Gallery)
function openProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const mainImgEl = document.getElementById('modalProductImg');
    const thumbsContainer = document.getElementById('modalThumbnails');
    
    mainImgEl.src = product.images[0] || 'https://via.placeholder.com/300';
    thumbsContainer.innerHTML = '';

    if (product.images.length > 1) {
        product.images.forEach((imgSrc, idx) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = 'thumb-item' + (idx === 0 ? ' active' : '');
            thumb.onclick = function() {
                mainImgEl.src = imgSrc;
                document.querySelectorAll('#modalThumbnails .thumb-item').forEach(el => el.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbsContainer.appendChild(thumb);
        });
    }

    document.getElementById('modalProductName').innerText = product.name;
    document.getElementById('modalProductPrice').innerText = `৳${product.price}`;
    document.getElementById('modalProductDesc').innerText = product.desc || 'প্রিমিয়াম কোয়ালিটির এই পণ্যটি অত্যন্ত স্টাইলিশ এবং টেকসই।';
    
    const addBtn = document.getElementById('modalAddToCartBtn');
    addBtn.onclick = function() {
        addToCart(product.id);
        closeProductModal();
    };

    document.getElementById('productDetailModal').style.display = 'block';
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
        cart.push({ ...product, image: product.images[0], quantity: 1 });
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
        div.style.cssText = "display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f3f4f6;";
        div.innerHTML = `
            <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
            <div style="flex: 1; margin-left: 12px;">
                <div style="font-size: 13px; font-weight: 700;">${item.name}</div>
                <div style="font-size: 13px; color: #27ae60; font-weight: 700;">৳${item.price}</div>
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
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart();
}

function removeCartItem(index) {
    cart.splice(index, 1);
    saveCart();
}

function toggleCartDrawer(forceOpen = false) {
    const drawer = document.getElementById('cartDrawer');
    if (!drawer) return;
    if (forceOpen) {
        drawer.style.right = '0px';
    } else {
        drawer.style.right = (drawer.style.right === '0px') ? '-400px' : '0px';
    }
}

// Checkout
function openCheckoutModal() {
    if (cart.length === 0) {
        alert("আপনার কার্ট খালি!");
        return;
    }
    if (!loggedInUser) {
        alert("অর্ডার করতে অনুগ্রহ করে লগইন করুন!");
        openCustomerAuthModal();
        return;
    }
    document.getElementById('cartDrawer').style.right = '-400px';
    document.getElementById('checkoutModal').style.display = 'block';
    const emailInput = document.getElementById('customerEmail');
    if (emailInput) emailInput.value = loggedInUser.email;
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
        div.style.cssText = "display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;";
        div.innerHTML = `<span>${item.name} (x${item.quantity})</span><span style="font-weight: 600;">৳${item.price * item.quantity}</span>`;
        list.appendChild(div);
    });

    document.getElementById('summaryTotalQty').innerText = totalQty;
    document.getElementById('modalSubtotal').innerText = `৳${subtotal}`;
    calculateFinalTotal();
}

function calculateFinalTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = parseInt(document.getElementById('deliveryLocation').value) || 70;
    document.getElementById('modalDeliveryFee').innerText = `৳${deliveryFee}`;
    document.getElementById('modalGrandTotal').innerText = `৳${subtotal + deliveryFee}`;
}

// Admin Dashboard Functions
function openAdminDashboardFromTop() {
    document.getElementById('adminDashboardModal').style.display = 'block';
    loadAdminDashboardData();
}

function closeAdminDashboard() {
    document.getElementById('adminDashboardModal').style.display = 'none';
}

function switchAdminTab(tabName) {
    document.getElementById('adminDashboardView').style.display = tabName === 'dashboard' ? 'block' : 'none';
    document.getElementById('adminProductsView').style.display = tabName === 'products' ? 'block' : 'none';
    
    document.getElementById('tabDashBtn').classList.toggle('active-tab', tabName === 'dashboard');
    document.getElementById('tabProdBtn').classList.toggle('active-tab', tabName === 'products');
}

function loadAdminDashboardData() {
    let totalRev = orders.reduce((sum, o) => sum + o.grandTotal, 0);
    document.getElementById('dashRevenue').innerText = `৳${totalRev}`;
    document.getElementById('dashOrdersCount').innerText = orders.length;
    document.getElementById('dashProductsCount').innerText = products.length;

    renderAdminOrdersTable();
    renderAdminInventoryTable();
}

function renderAdminOrdersTable() {
    const tbody = document.getElementById('dashOrdersTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">No orders received yet.</td></tr>`;
        return;
    }

    orders.forEach((order, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${order.id}</strong></td>
            <td>${order.customer.name}<br><small style="color: #6b7280;">${order.customer.phone}</small></td>
            <td style="font-weight: 700;">৳${order.grandTotal}</td>
            <td><span style="background: #ecfdf5; color: #27ae60; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700;">${order.status}</span></td>
            <td>
                <button onclick="deleteOrder(${idx})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteOrder(idx) {
    if (confirm("অর্ডারটি ডিলিট করতে চান?")) {
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
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${p.images[0]}" style="width: 42px; height: 42px; object-fit: cover; border-radius: 6px;">
                    <div>
                        <div style="font-weight: 700;">${p.name}</div>
                        <small style="color: #6b7280;">${p.images.length} photo(s)</small>
                    </div>
                </div>
            </td>
            <td style="font-weight: 700;">৳${p.price}</td>
            <td>${p.stock} units</td>
            <td>
                <button onclick="editProduct(${idx})" style="background: #2563eb; color: white; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; margin-right: 6px;">Edit</button>
                <button onclick="deleteProduct(${idx})" style="background: #ef4444; color: white; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer;">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Multi-Photo Selection (Max 4 Images)
let uploadedImagesArray = [];

function handleMultiFileSelect(e) {
    const files = Array.from(e.target.files).slice(0, 4);
    if (files.length === 0) return;

    if (e.target.files.length > 4) {
        alert("সর্বোচ্চ ৪টি ছবি সিলেক্ট করা যাবে! প্রথম ৪টি ছবি নেওয়া হয়েছে।");
    }

    uploadedImagesArray = [];
    const thumbsContainer = document.getElementById('adminPreviewThumbs');
    thumbsContainer.innerHTML = '';

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64 = event.target.result;
            uploadedImagesArray.push(base64);

            if (index === 0) {
                document.getElementById('prevImg').src = base64;
            }

            const thumb = document.createElement('img');
            thumb.src = base64;
            thumb.className = 'thumb-item' + (index === 0 ? ' active' : '');
            thumb.onclick = function() {
                document.getElementById('prevImg').src = base64;
                document.querySelectorAll('#adminPreviewThumbs .thumb-item').forEach(el => el.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbsContainer.appendChild(thumb);
        };
        reader.readAsDataURL(file);
    });
}

function updateAdminPreview() {
    const name = document.getElementById('adminPName').value || 'Product Title';
    const price = document.getElementById('adminPPrice').value || '0';
    document.getElementById('prevName').innerText = name;
    document.getElementById('prevPrice').innerText = `৳${price}`;
}

function handleSaveProduct(e) {
    e.preventDefault();
    const idField = document.getElementById('adminProductId').value;
    const name = document.getElementById('adminPName').value;
    const desc = document.getElementById('adminPDesc').value;
    const stock = parseInt(document.getElementById('adminPStock').value) || 10;
    const price = parseFloat(document.getElementById('adminPPrice').value) || 0;

    let finalImages = uploadedImagesArray.length > 0 
        ? uploadedImagesArray 
        : (idField !== "" ? products[idField].images : ["b2.jpg"]);

    if (idField !== "") {
        products[idField] = { id: products[idField].id, name, desc, stock, price, images: finalImages };
    } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, desc, stock, price, images: finalImages });
    }

    localStorage.setItem('sr_admin_products', JSON.stringify(products));
    renderProducts();
    loadAdminDashboardData();
    resetAdminForm();
    switchAdminTab('dashboard');
    alert("প্রোডাক্ট ও ছবিগুলো সফলভাবে সেভ করা হয়েছে!");
}

function editProduct(idx) {
    const p = products[idx];
    document.getElementById('adminProductId').value = idx;
    document.getElementById('adminPName').value = p.name;
    document.getElementById('adminPDesc').value = p.desc || '';
    document.getElementById('adminPStock').value = p.stock;
    document.getElementById('adminPPrice').value = p.price;
    
    uploadedImagesArray = [...p.images];
    document.getElementById('prevImg').src = p.images[0] || 'https://via.placeholder.com/300';
    
    const thumbsContainer = document.getElementById('adminPreviewThumbs');
    thumbsContainer.innerHTML = '';
    p.images.forEach((imgSrc, i) => {
        const thumb = document.createElement('img');
        thumb.src = imgSrc;
        thumb.className = 'thumb-item' + (i === 0 ? ' active' : '');
        thumb.onclick = () => { document.getElementById('prevImg').src = imgSrc; };
        thumbsContainer.appendChild(thumb);
    });

    updateAdminPreview();
    switchAdminTab('products');
}

function deleteProduct(idx) {
    if (confirm("আপনি কি এই প্রোডাক্টটি ডিলিট করতে চান?")) {
        products.splice(idx, 1);
        localStorage.setItem('sr_admin_products', JSON.stringify(products));
        renderProducts();
        loadAdminDashboardData();
    }
}

function resetAdminForm() {
    const form = document.getElementById('adminProductForm');
    if (form) form.reset();
    document.getElementById('adminProductId').value = "";
    uploadedImagesArray = [];
    document.getElementById('adminPreviewThumbs').innerHTML = '';
    document.getElementById('prevImg').src = "https://via.placeholder.com/300?text=Photo+Preview";
    document.getElementById('prevName').innerText = "Product Title";
    document.getElementById('prevPrice').innerText = "৳0";
}
