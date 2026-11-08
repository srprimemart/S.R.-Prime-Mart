// ডিফল্ট প্রোডাক্ট তালিকা (শুধুমাত্র ১টি প্রাইস, কোনো রেটিং নেই)
const defaultProducts = [
    {
        id: 1,
        name: "Aurora Wireless Headphones",
        category: "Electronics",
        price: 199.00,
        stock: 23,
        description: "Studio-grade sound with active noise cancellation, 40-hour battery life and plush memory-foam cushions.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop"
    },
    {
        id: 2,
        name: "Midnight Runner Sneakers",
        category: "Footwear",
        price: 89.00,
        stock: 30,
        description: "Lightweight running sneakers for everyday athletic performance.",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop"
    },
    {
        id: 3,
        name: "Pure White Classics",
        category: "Footwear",
        price: 99.00,
        stock: 22,
        description: "Minimalist classic sneakers with soft leather padding.",
        image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&auto=format&fit=crop"
    },
    {
        id: 4,
        name: "Heritage Leather Watch",
        category: "Accessories",
        price: 349.00,
        stock: 8,
        description: "Premium analog watch with genuine leather strap.",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop"
    }
];

// নমুনা অর্ডার
const defaultOrders = [
    {
        orderId: "#00001",
        customerName: "Jane Doe",
        customerPhone: "01700000000",
        customerAddress: "Dhaka, Bangladesh",
        payMethod: "Cash on Delivery",
        itemsSummary: "Aurora Wireless Headphones (x1)",
        date: "11/8/2026",
        total: 269.00,
        status: "Paid"
    }
];

// ভার্সন v9 দিয়ে লোকাল স্টোরেজের পুরানো ডেটা সম্পূর্ণ ফ্লাশ/রিসেট করা হয়েছে
let storedProducts = localStorage.getItem('sr_products_v9');
let products = storedProducts ? JSON.parse(storedProducts) : defaultProducts;

let storedOrders = localStorage.getItem('sr_orders_v9');
let orders = storedOrders ? JSON.parse(storedOrders) : defaultOrders;

let cart = [];
let uploadedImageBase64 = null;

document.addEventListener('DOMContentLoaded', () => {
    saveProductsToStorage();
    saveOrdersToStorage();
    renderProducts(products);
    updateCartUI();
});

function saveProductsToStorage() {
    localStorage.setItem('sr_products_v9', JSON.stringify(products));
}

function saveOrdersToStorage() {
    localStorage.setItem('sr_orders_v9', JSON.stringify(orders));
}

// Render Main Storefront Products (একটিমাত্র প্রাইস)
function renderProducts(items) {
    const container = document.getElementById('product-container');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">No products available!</p>`;
        return;
    }

    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div class="image-box-wrapper">
                <div class="image-box" onclick="openProductModal(${product.id})" title="Click to view details">
                    <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/200?text=Product+Image';">
                </div>
            </div>
            <div class="product-category">${product.category || 'GENERAL'}</div>
            <div class="product-title" onclick="openProductModal(${product.id})" title="${product.name}">${product.name}</div>
            <div class="price-buy-row" style="margin-top: 10px;">
                <div>
                    <span class="product-price">৳${product.price}</span>
                </div>
                <button class="buy-btn" onclick="directBuyNow(${product.id})">Buy</button>
            </div>
        </div>
    `).join('');
}

function directBuyNow(productId) {
    addToCart(productId);
    const drawer = document.getElementById('cartDrawer');
    if (drawer && !drawer.classList.contains('open')) {
        drawer.classList.add('open');
    }
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.category && p.category.toLowerCase().includes(query))
    );
    renderProducts(filtered);
}

// Cart System
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

function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modalProductImg').src = product.image;
    document.getElementById('modalProductName').innerText = product.name;
    document.getElementById('modalProductPrice').innerText = `৳${product.price}`;
    document.getElementById('modalCategory').innerText = product.category || "GENERAL";
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

/* AUTOMATIC CUSTOMER ORDER SUBMISSION */
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const customerName = document.getElementById('customerName').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const customerAddress = document.getElementById('customerAddress').value;
        const payMethod = document.querySelector('input[name="PaymentMethod"]:checked')?.value || 'COD';
        
        const deliverySelect = document.getElementById('deliveryLocation');
        const deliveryFee = deliverySelect ? parseInt(deliverySelect.value) : 70;
        
        let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let grandTotal = subtotal + deliveryFee;

        let itemsSummaryStr = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');

        const newOrder = {
            orderId: `#${String(orders.length + 1).padStart(5, '0')}`,
            customerName: customerName,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            payMethod: payMethod,
            itemsSummary: itemsSummaryStr,
            date: new Date().toLocaleDateString('en-US'),
            total: grandTotal,
            status: "Pending"
        };

        // Deduct Stock
        cart.forEach(cartItem => {
            const p = products.find(prod => prod.id === cartItem.id);
            if (p) {
                p.stock = Math.max(0, (p.stock || 10) - cartItem.quantity);
            }
        });
        saveProductsToStorage();
        renderProducts(products);

        orders.unshift(newOrder);
        saveOrdersToStorage();

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
        }, 3500);
    });
}

/* ADMIN DASHBOARD ENGINE */
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
    renderDashboardView();
    renderAdminProductManageList();
}

function closeAdminDashboard() {
    document.getElementById('adminDashboardModal').style.display = 'none';
}

function switchAdminTab(tab) {
    const dashView = document.getElementById('adminDashboardView');
    const prodView = document.getElementById('adminProductsView');
    const btnDash = document.getElementById('btnTabDashboard');
    const btnProd = document.getElementById('btnTabProducts');

    if (tab === 'dashboard') {
        dashView.style.display = 'block';
        prodView.style.display = 'none';
        btnDash.classList.add('active');
        btnProd.classList.remove('active');
        renderDashboardView();
    } else {
        dashView.style.display = 'none';
        prodView.style.display = 'block';
        btnDash.classList.remove('active');
        btnProd.classList.add('active');
        renderAdminProductManageList();
    }
}

function renderDashboardView() {
    let totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
    document.getElementById('dashRevenue').innerText = `৳${totalRevenue.toFixed(2)}`;
    document.getElementById('dashOrdersCount').innerText = orders.length;
    document.getElementById('dashProductsCount').innerText = products.length;

    const ordersTbody = document.getElementById('dashOrdersTbody');
    if (ordersTbody) {
        if (orders.length === 0) {
            ordersTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888;">No orders recorded yet.</td></tr>`;
        } else {
            ordersTbody.innerHTML = orders.map((ord, idx) => `
                <tr>
                    <td><strong>${ord.orderId}</strong></td>
                    <td>
                        <div><strong>${ord.customerName}</strong> (${ord.customerPhone})</div>
                        <small style="color: #6b7280; display: block;">📍 ${ord.customerAddress}</small>
                        <small style="color: #059669; font-weight: 500;">🛒 ${ord.itemsSummary || 'Items'} [${ord.payMethod || 'COD'}]</small>
                    </td>
                    <td>${ord.date}</td>
                    <td><strong>৳${parseFloat(ord.total).toFixed(2)}</strong></td>
                    <td>
                        <select class="status-select" id="statusSelect_${idx}">
                            <option value="Pending" ${ord.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Paid" ${ord.status === 'Paid' ? 'selected' : ''}>Paid</option>
                            <option value="Delivered" ${ord.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Cancelled" ${ord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <button class="status-save-btn" onclick="saveOrderStatus(${idx})">Save</button>
                    </td>
                    <td>
                        <button class="action-icon-btn" onclick="openEditCustomerModal(${idx})" title="Edit Customer Info" style="color: #27ae60;"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-icon-btn" onclick="deleteOrder(${idx})" title="Delete Order" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    }

    const invTbody = document.getElementById('dashInventoryTbody');
    let lowStockCount = 0;

    if (invTbody) {
        invTbody.innerHTML = products.map((p, idx) => {
            const currentStock = p.stock !== undefined ? p.stock : 10;
            const isLow = currentStock <= 10;
            if (isLow) lowStockCount++;

            return `
                <tr>
                    <td>
                        <div class="prod-cell-box">
                            <img src="${p.image}" class="prod-cell-img" onerror="this.src='https://via.placeholder.com/40';">
                            <span><strong>${p.name}</strong></span>
                        </div>
                    </td>
                    <td>${p.category || 'General'}</td>
                    <td>৳${parseFloat(p.price).toFixed(2)}</td>
                    <td class="${isLow ? 'text-low-stock' : ''}"><strong>${currentStock}</strong></td>
                    <td>
                        <button class="stock-control-btn" onclick="adjustStock(${idx}, -1)">-</button>
                        <span style="margin: 0 8px; font-weight: 600;">${currentStock}</span>
                        <button class="stock-control-btn" onclick="adjustStock(${idx}, 1)">+</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    const lowStockText = document.getElementById('dashLowStockText');
    if (lowStockText) {
        lowStockText.innerText = `${lowStockCount} product(s) low on stock.`;
    }
}

function adjustStock(productIndex, amount) {
    if (products[productIndex]) {
        let current = products[productIndex].stock !== undefined ? products[productIndex].stock : 10;
        products[productIndex].stock = Math.max(0, current + amount);
        saveProductsToStorage();
        renderProducts(products);
        renderDashboardView();
    }
}

function saveOrderStatus(orderIndex) {
    const select = document.getElementById(`statusSelect_${orderIndex}`);
    if (select && orders[orderIndex]) {
        orders[orderIndex].status = select.value;
        saveOrdersToStorage();
        alert(`Order status updated to "${select.value}"!`);
    }
}

function deleteOrder(orderIndex) {
    if (confirm('Are you sure you want to delete this order record?')) {
        orders.splice(orderIndex, 1);
        saveOrdersToStorage();
        renderDashboardView();
    }
}

function openEditCustomerModal(orderIndex) {
    const ord = orders[orderIndex];
    if (!ord) return;

    document.getElementById('editOrderIndex').value = orderIndex;
    document.getElementById('editCustomerName').value = ord.customerName || '';
    document.getElementById('editCustomerPhone').value = ord.customerPhone || '';
    document.getElementById('editCustomerAddress').value = ord.customerAddress || '';
    document.getElementById('editOrderTotal').value = ord.total || 0;

    document.getElementById('editCustomerModal').style.display = 'block';
}

function closeEditCustomerModal() {
    document.getElementById('editCustomerModal').style.display = 'none';
}

function saveCustomerInfoEdit() {
    const idx = document.getElementById('editOrderIndex').value;
    if (orders[idx]) {
        orders[idx].customerName = document.getElementById('editCustomerName').value;
        orders[idx].customerPhone = document.getElementById('editCustomerPhone').value;
        orders[idx].customerAddress = document.getElementById('editCustomerAddress').value;
        orders[idx].total = parseFloat(document.getElementById('editOrderTotal').value) || orders[idx].total;

        saveOrdersToStorage();
        closeEditCustomerModal();
        renderDashboardView();
        alert('✅ Customer information updated successfully!');
    }
}

/* PRODUCT LISTING & SETUP */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImageBase64 = e.target.result;
            updateAdminPreview();
        };
        reader.readAsDataURL(file);
    }
}

function updateAdminPreview() {
    const name = document.getElementById('adminPName').value || 'Product Title';
    const category = (document.getElementById('adminPCategory').value || 'CATEGORY').toUpperCase();
    const price = document.getElementById('adminPPrice').value || '0.00';
    
    const prevImg = document.getElementById('prevImg');

    document.getElementById('prevName').innerText = name;
    document.getElementById('prevCategory').innerText = category;
    document.getElementById('prevPrice').innerText = `৳${price}`;

    if (uploadedImageBase64) {
        prevImg.src = uploadedImageBase64;
    }
}

function handleSaveProduct(e) {
    e.preventDefault();

    const idInput = document.getElementById('adminProductId').value;
    const name = document.getElementById('adminPName').value;
    const category = document.getElementById('adminPCategory').value || 'General';
    const price = parseFloat(document.getElementById('adminPPrice').value);
    const stock = parseInt(document.getElementById('adminPStock').value) || 10;
    const description = document.getElementById('adminPDesc').value;

    if (idInput) {
        const index = products.findIndex(p => p.id == idInput);
        if (index !== -1) {
            const finalImage = uploadedImageBase64 || products[index].image;
            products[index] = { 
                ...products[index], 
                name, 
                category, 
                price, 
                stock,
                description, 
                image: finalImage 
            };
        }
    } else {
        if (!uploadedImageBase64) {
            alert('Please select an image file from your device first!');
            return;
        }

        const newProduct = {
            id: Date.now(),
            name,
            category,
            price,
            stock,
            description,
            image: uploadedImageBase64
        };
        products.push(newProduct);
    }

    saveProductsToStorage();
    renderProducts(products);
    renderAdminProductManageList();
    resetAdminForm();
    alert('✅ Product setup saved successfully!');
}

function editProductInAdmin(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('adminProductId').value = product.id;
    document.getElementById('adminPName').value = product.name;
    document.getElementById('adminPCategory').value = product.category || '';
    document.getElementById('adminPPrice').value = product.price;
    document.getElementById('adminPStock').value = product.stock !== undefined ? product.stock : 10;
    document.getElementById('adminPDesc').value = product.description || '';
    
    uploadedImageBase64 = product.image;

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
    uploadedImageBase64 = null;
    document.getElementById('adminFormTitle').innerText = 'Add / Edit Product';
    document.getElementById('prevImg').src = 'https://via.placeholder.com/200?text=Image+Preview';
    updateAdminPreview();
}

function renderAdminProductManageList() {
    const container = document.getElementById('adminProductManageList');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `<p style="color: #888;">No products listed yet.</p>`;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="admin-prod-item">
            <span><strong>${product.name}</strong> (৳${product.price}) — Stock: ${product.stock !== undefined ? product.stock : 10}</span>
            <div>
                <button onclick="editProductInAdmin(${product.id})" style="background: none; border: none; color: #27ae60; cursor: pointer; margin-right: 10px; font-weight: 600;">Edit</button>
                <button onclick="deleteProductInAdmin(${product.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: 600;">Delete</button>
            </div>
        </div>
    `).join('');
}
