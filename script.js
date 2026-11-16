
/* =========================================================
   S.R. PRIME MART
   Firebase Authentication + Products + Cart + Checkout
   ========================================================= */

/* ---------------- FIREBASE IMPORTS ---------------- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* ---------------- FIREBASE CONFIG ---------------- */

const firebaseConfig = {
    apiKey: "AIzaSyCysJRNg1OsWNjCny9xB3-3xGJmuFJMJVT",
    authDomain: "srprimemart-177c5.firebaseapp.com",
    projectId: "srprimemart-177c5",
    storageBucket: "srprimemart-177c5.firebasestorage.app",
    messagingSenderId: "132024731701",
    appId: "1:132024731701:web:877ef144c03731454b497c",
    measurementId: "G-RLPXZEW6PH"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const ADMIN_UID = "VJvdQjS0ygSx46SnLqcyPx49mi02";

let currentUser = null;
let isAdminUser = false;


/* ---------------- DEFAULT PRODUCTS ---------------- */

const defaultProducts = [
    {
        id: 1,
        name: "Aurora Wireless Headphones",
        category: "Electronics",
        price: 199,
        stock: 23,
        description: "Studio-grade sound with active noise cancellation, 40-hour battery life and plush memory-foam cushions.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop"
    },
    {
        id: 2,
        name: "Midnight Runner Sneakers",
        category: "Footwear",
        price: 89,
        stock: 30,
        description: "Lightweight running sneakers for everyday athletic performance.",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop"
    },
    {
        id: 3,
        name: "Pure White Classics",
        category: "Footwear",
        price: 99,
        stock: 22,
        description: "Minimalist classic sneakers with soft leather padding.",
        image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&auto=format&fit=crop"
    },
    {
        id: 4,
        name: "Heritage Leather Watch",
        category: "Accessories",
        price: 349,
        stock: 8,
        description: "Premium analog watch with genuine leather strap.",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop"
    }
];


/* ---------------- LOCAL STORAGE ---------------- */

function loadStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.error("Storage loading error:", error);
        return fallback;
    }
}

let products = loadStorage("sr_products_v9", defaultProducts);
let orders = loadStorage("sr_orders_v9", []);

let cart = [];
let uploadedImageBase64 = null;

let customerEmails = loadStorage("sr_customer_emails_v1", []);


function saveProductsToStorage() {
    localStorage.setItem("sr_products_v9", JSON.stringify(products));
}

function saveOrdersToStorage() {
    localStorage.setItem("sr_orders_v9", JSON.stringify(orders));
}

function saveCustomerEmails() {
    localStorage.setItem("sr_customer_emails_v1", JSON.stringify(customerEmails));
}


/* ---------------- COMMON HELPERS ---------------- */

function getElement(id) {
    return document.getElementById(id);
}

function formatMoney(amount) {
    return "৳" + Number(amount || 0).toLocaleString("en-US");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character];
    });
}

function showAuthError(error) {
    console.error(error);

    const messages = {
        "auth/email-already-in-use": "এই Email দিয়ে আগে থেকেই Account তৈরি করা আছে।",
        "auth/invalid-email": "সঠিক Email Address দিন।",
        "auth/weak-password": "Password কমপক্ষে ৬ অক্ষরের হতে হবে।",
        "auth/invalid-credential": "Email অথবা Password সঠিক নয়।",
        "auth/user-not-found": "এই Email দিয়ে কোনো Account পাওয়া যায়নি।",
        "auth/wrong-password": "Password সঠিক নয়।",
        "auth/popup-closed-by-user": "Google Login বন্ধ করা হয়েছে।",
        "auth/popup-blocked": "Browser Popup Block করেছে। Popup Allow করে আবার চেষ্টা করুন।",
        "auth/network-request-failed": "Internet Connection পরীক্ষা করে আবার চেষ্টা করুন।",
        "auth/too-many-requests": "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
        "auth/unauthorized-domain": "Firebase Console-এ Website Domain Authorized করতে হবে।"
    };

    alert(messages[error.code] || error.message || "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।");
}


/* ---------------- CUSTOMER EMAIL LIST ---------------- */

function saveCustomerEmail(user, method) {
    if (!user || !user.email) return;

    const email = user.email.toLowerCase();

    const existing = customerEmails.find(item => item.email === email);

    if (existing) {
        existing.method = method;
        existing.lastLogin = new Date().toLocaleString();
    } else {
        customerEmails.unshift({
            email: email,
            method: method,
            date: new Date().toLocaleString(),
            lastLogin: new Date().toLocaleString()
        });
    }

    saveCustomerEmails();
}


/* ---------------- AUTHENTICATION STATE ---------------- */

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    isAdminUser = !!user && user.uid === ADMIN_UID;

    const authText = getElement("userAuthText");
    const adminButton = getElement("adminPanelTopBtn");
    const customerEmailInput = getElement("customerEmail");

    if (user) {
        if (authText) {
            authText.textContent = "Logout";
        }

        if (customerEmailInput) {
            customerEmailInput.value = user.email || "";
        }

        if (adminButton) {
            adminButton.style.display = isAdminUser ? "inline-block" : "none";
        }

        if (isAdminUser) {
            console.log("Authorized Admin logged in.");
        }

    } else {
        if (authText) {
            authText.textContent = "Login / Register";
        }

        if (customerEmailInput) {
            customerEmailInput.value = "";
        }

        if (adminButton) {
            adminButton.style.display = "none";
        }
    }
});


/* ---------------- CUSTOMER AUTH MODAL ---------------- */

function openCustomerAuthModal() {
    if (currentUser) {
        const confirmLogout = confirm("আপনি কি Logout করতে চান?");

        if (confirmLogout) {
            signOut(auth).catch(showAuthError);
        }

        return;
    }

    const modal = getElement("customerAuthModal");
    if (modal) modal.style.display = "block";
}

function closeCustomerAuthModal() {
    const modal = getElement("customerAuthModal");
    if (modal) modal.style.display = "none";
}


/* ---------------- EMAIL LOGIN ---------------- */

async function handleCustomerEmailLogin(event) {
    if (event) event.preventDefault();

    const email = getElement("custModalEmail")?.value.trim();
    const password = getElement("custModalPass")?.value;

    if (!email || !password) {
        alert("Email এবং Password দিন।");
        return;
    }

    try {
        const result = await signInWithEmailAndPassword(auth, email, password);

        saveCustomerEmail(result.user, "Email/Password");

        closeCustomerAuthModal();

        alert("Login সফল হয়েছে। Welcome to S.R. Prime Mart!");

    } catch (error) {
        showAuthError(error);
    }
}


/* ---------------- CUSTOMER REGISTER ---------------- */

async function handleCustomerRegister() {
    const email = getElement("custModalEmail")?.value.trim();
    const password = getElement("custModalPass")?.value;

    if (!email || !password) {
        alert("প্রথমে Email এবং Password লিখুন।");
        return;
    }

    if (password.length < 6) {
        alert("Password কমপক্ষে ৬ অক্ষরের হতে হবে।");
        return;
    }

    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        saveCustomerEmail(result.user, "Email/Password");

        closeCustomerAuthModal();

        alert("আপনার Account সফলভাবে তৈরি হয়েছে!");

    } catch (error) {
        showAuthError(error);
    }
}


/* ---------------- GOOGLE LOGIN ---------------- */

async function handleGoogleLogin() {
    try {
        const result = await signInWithPopup(auth, googleProvider);

        saveCustomerEmail(result.user, "Google");

        closeCustomerAuthModal();

        alert("Google Login সফল হয়েছে!");

    } catch (error) {
        showAuthError(error);
    }
}


/* ---------------- FORGOT PASSWORD ---------------- */

async function handleForgotPassword() {
    const email = getElement("custModalEmail")?.value.trim();

    if (!email) {
        alert("প্রথমে Email Address লিখুন।");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);

        alert("Password Reset Link আপনার Email-এ পাঠানো হয়েছে। Inbox এবং Spam Folder দেখুন।");

    } catch (error) {
        showAuthError(error);
    }
}


/* ---------------- ADMIN AUTHENTICATION ---------------- */

function openAdminDashboardFromTop() {
    if (!currentUser || currentUser.uid !== ADMIN_UID) {
        alert("আপনার Admin Access নেই।");
        return;
    }

    openAdminDashboard();
}

function openAdminDashboard() {
    if (!currentUser || currentUser.uid !== ADMIN_UID) {
        alert("শুধুমাত্র অনুমোদিত Admin Dashboard খুলতে পারবেন।");
        return;
    }

    const modal = getElement("adminDashboardModal");
    if (modal) modal.style.display = "block";

    switchAdminTab("dashboard");
    renderDashboardView();
    renderAdminProductManageList();
    renderCustomerEmails();
}

function closeAdminDashboard() {
    const modal = getElement("adminDashboardModal");
    if (modal) modal.style.display = "none";
}


/* ---------------- ADMIN TAB SYSTEM ---------------- */

function switchAdminTab(tab) {
    if (!isAdminUser) {
        alert("Admin access required.");
        return;
    }

    const dashView = getElement("adminDashboardView");
    const prodView = getElement("adminProductsView");
    const emailsView = getElement("adminEmailsView");

    const btnDash = getElement("btnTabDashboard");
    const btnProd = getElement("btnTabProducts");
    const btnEmails = getElement("btnTabEmails");

    [dashView, prodView, emailsView].forEach(element => {
        if (element) element.style.display = "none";
    });

    [btnDash, btnProd, btnEmails].forEach(element => {
        if (element) element.classList.remove("active");
    });

    if (tab === "products") {
        if (prodView) prodView.style.display = "block";
        if (btnProd) btnProd.classList.add("active");
        renderAdminProductManageList();

    } else if (tab === "emails") {
        if (emailsView) emailsView.style.display = "block";
        if (btnEmails) btnEmails.classList.add("active");
        renderCustomerEmails();

    } else {
        if (dashView) dashView.style.display = "block";
        if (btnDash) btnDash.classList.add("active");
        renderDashboardView();
    }
}


/* ---------------- PRODUCT RENDERING ---------------- */

function renderProducts(items) {
    const container = getElement("product-container");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <p style="grid-column:1/-1;text-align:center;color:#888;">
                No products available!
            </p>
        `;
        return;
    }

    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div class="image-box-wrapper">
                <div class="image-box"
                     onclick="openProductModal(${Number(product.id)})"
                     title="Click to view details">

                    <img src="${escapeHTML(product.image)}"
                         alt="${escapeHTML(product.name)}"
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/300?text=Product+Image';">
                </div>
            </div>

            <div class="product-category">
                ${escapeHTML(product.category || "GENERAL")}
            </div>

            <div class="product-title"
                 onclick="openProductModal(${Number(product.id)})"
                 title="${escapeHTML(product.name)}">
                ${escapeHTML(product.name)}
            </div>

            <div class="price-buy-row" style="margin-top:10px;">
                <div>
                    <span class="product-price">${formatMoney(product.price)}</span>
                </div>

                <button class="buy-btn"
                        onclick="directBuyNow(${Number(product.id)})">
                    Buy
                </button>
            </div>
        </div>
    `).join("");
}

function searchProducts() {
    const query = (getElement("searchInput")?.value || "").toLowerCase();

    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.category || "").toLowerCase().includes(query)
    );

    renderProducts(filtered);
}

function filterByCategory(category) {
    const filtered = products.filter(product =>
        (product.category || "").toLowerCase() === category.toLowerCase()
    );

    renderProducts(filtered);
}


/* ---------------- CART SYSTEM ---------------- */

function addToCart(productId) {
    const product = products.find(item => Number(item.id) === Number(productId));

    if (!product) return;

    const currentStock = Number(product.stock ?? 10);

    const existingItem = cart.find(item => Number(item.id) === Number(productId));

    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity >= currentStock) {
        alert("এই Product-এর পর্যাপ্ত Stock নেই।");
        return;
    }

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCartUI();
}

function directBuyNow(productId) {
    addToCart(productId);

    const drawer = getElement("cartDrawer");

    if (drawer && cart.length > 0) {
        drawer.classList.add("open");
    }
}

function decreaseQty(productId) {
    const item = cart.find(i => Number(i.id) === Number(productId));

    if (!item) return;

    item.quantity -= 1;

    if (item.quantity <= 0) {
        cart = cart.filter(i => Number(i.id) !== Number(productId));
    }

    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(i => Number(i.id) !== Number(productId));
    updateCartUI();
}

function toggleCartDrawer() {
    const drawer = getElement("cartDrawer");

    if (drawer) {
        drawer.classList.toggle("open");
    }
}

function updateCartUI() {
    const cartCount = getElement("cartCount");
    const drawerItemsContainer = getElement("drawerItemsContainer");
    const drawerSubtotal = getElement("drawerSubtotal");
    const drawerItemsTotal = getElement("drawerItemsTotal");
    const drawerItemHeaderSub = getElement("drawerItemHeaderSub");

    let totalCount = 0;
    let subtotal = 0;

    cart.forEach(item => {
        totalCount += item.quantity;
        subtotal += Number(item.price) * item.quantity;
    });

    if (cartCount) cartCount.innerText = totalCount;
    if (drawerItemHeaderSub) drawerItemHeaderSub.innerText = `${totalCount} items`;
    if (drawerSubtotal) drawerSubtotal.innerText = formatMoney(subtotal);
    if (drawerItemsTotal) drawerItemsTotal.innerText = formatMoney(subtotal);

    if (drawerItemsContainer) {
        if (cart.length === 0) {
            drawerItemsContainer.innerHTML = `
                <p style="text-align:center;color:#888;margin-top:40px;">
                    Your cart is empty
                </p>
            `;
        } else {
            drawerItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item-card">

                    <img src="${escapeHTML(item.image)}"
                         alt="${escapeHTML(item.name)}"
                         class="cart-item-img"
                         onerror="this.src='https://via.placeholder.com/60';">

                    <div class="cart-item-details">

                        <div class="cart-item-title">
                            ${escapeHTML(item.name)}
                        </div>

                        <div class="cart-item-bottom">

                            <span class="cart-item-price">
                                ${formatMoney(item.price)}
                            </span>

                            <div class="cart-qty-controls">

                                <button class="q-btn"
                                        onclick="decreaseQty(${Number(item.id)})">
                                    -
                                </button>

                                <span>${item.quantity}</span>

                                <button class="q-btn"
                                        onclick="addToCart(${Number(item.id)})">
                                    +
                                </button>

                                <i class="fa-solid fa-trash-can delete-btn"
                                   onclick="removeFromCart(${Number(item.id)})">
                                </i>

                            </div>
                        </div>
                    </div>
                </div>
            `).join("");
        }
    }

    updateCheckoutUI(subtotal, totalCount);
}


/* ---------------- CHECKOUT ---------------- */

function openCheckoutModal() {
    if (cart.length === 0) {
        alert("আপনার Cart খালি!");
        return;
    }

    if (!currentUser) {
        alert("অর্ডার করার আগে Login / Register করুন।");
        openCustomerAuthModal();
        return;
    }

    const drawer = getElement("cartDrawer");
    if (drawer) drawer.classList.remove("open");

    const emailInput = getElement("customerEmail");

    if (emailInput) {
        emailInput.value = currentUser.email || "";
    }

    const modal = getElement("checkoutModal");

    if (modal) modal.style.display = "block";

    updateCartUI();
}

function closeCheckoutModal() {
    const modal = getElement("checkoutModal");
    if (modal) modal.style.display = "none";
}

function updateCheckoutUI(subtotal, totalCount) {
    const checkoutItemsList = getElement("checkoutItemsList");
    const summaryTotalQty = getElement("summaryTotalQty");
    const modalSubtotal = getElement("modalSubtotal");

    if (summaryTotalQty) summaryTotalQty.innerText = totalCount;

    if (modalSubtotal) {
        modalSubtotal.innerText = `BDT ${subtotal}`;
    }

    if (checkoutItemsList) {
        checkoutItemsList.innerHTML = cart.map(item => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;border-bottom:1px solid #f3f4f6;padding-bottom:10px;">

                <img src="${escapeHTML(item.image)}"
                     style="width:50px;height:50px;object-fit:cover;border-radius:6px;"
                     onerror="this.src='https://via.placeholder.com/50';">

                <div style="flex-grow:1;">
                    <div style="font-size:13px;font-weight:500;color:#1f2937;">
                        ${escapeHTML(item.name)}
                    </div>

                    <div style="font-size:12px;color:#6b7280;">
                        BDT ${item.price} × ${item.quantity}
                    </div>
                </div>

                <div style="font-weight:700;font-size:13px;">
                    BDT ${item.price * item.quantity}
                </div>

            </div>
        `).join("");
    }

    calculateFinalTotal();
}

function calculateFinalTotal() {
    const subtotal = cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
    );

    const deliverySelect = getElement("deliveryLocation");

    const deliveryFee = deliverySelect
        ? Number(deliverySelect.value)
        : 70;

    const modalDeliveryFee = getElement("modalDeliveryFee");
    const modalGrandTotal = getElement("modalGrandTotal");

    if (modalDeliveryFee) {
        modalDeliveryFee.innerText = `BDT ${deliveryFee}`;
    }

    if (modalGrandTotal) {
        modalGrandTotal.innerText = `BDT ${subtotal + deliveryFee}`;
    }

    return {
        subtotal,
        deliveryFee,
        grandTotal: subtotal + deliveryFee
    };
}


/* ---------------- ORDER SUBMISSION ---------------- */

async function handleOrderSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
        alert("অর্ডার করার আগে Login করুন।");
        openCustomerAuthModal();
        return;
    }

    if (cart.length === 0) {
        alert("আপনার Cart খালি!");
        return;
    }

    const customerName = getElement("customerName")?.value.trim();
    const customerPhone = getElement("customerPhone")?.value.trim();
    const customerAddress = getElement("customerAddress")?.value.trim();

    const paymentMethod =
        document.querySelector('input[name="PaymentMethod"]:checked')?.value ||
        "Cash on Delivery";

    if (!customerName || !customerPhone || !customerAddress) {
        alert("সব Customer Information পূরণ করুন।");
        return;
    }

    /* Stock check before order */

    for (const item of cart) {
        const product = products.find(p => Number(p.id) === Number(item.id));

        if (!product || Number(product.stock ?? 10) < item.quantity) {
            alert(`${item.name} - পর্যাপ্ত Stock নেই।`);
            return;
        }
    }

    const totals = calculateFinalTotal();

    const itemsSummary = cart.map(item =>
        `${item.name} (x${item.quantity})`
    ).join(", ");

    const newOrder = {
        orderId: "SR-" + Date.now(),
        customerName,
        customerEmail: currentUser.email || "",
        customerPhone,
        customerAddress,
        payMethod: paymentMethod,
        itemsSummary,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        total: totals.grandTotal,
        date: new Date().toLocaleString(),
        status: "Pending"
    };

    const submitBtn = getElement("submitBtn");
    const successMessage = getElement("successMessage");

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing...";
    }

    try {
        /* Save order in this browser */

        orders.unshift(newOrder);
        saveOrdersToStorage();

        /* Deduct product stock */

        cart.forEach(cartItem => {
            const product = products.find(
                p => Number(p.id) === Number(cartItem.id)
            );

            if (product) {
                product.stock = Math.max(
                    0,
                    Number(product.stock ?? 10) - cartItem.quantity
                );
            }
        });

        saveProductsToStorage();

        /* Remember customer email locally */

        saveCustomerEmail(currentUser, "Order");

        renderProducts(products);

        if (successMessage) {
            successMessage.style.display = "block";
        }

        if (submitBtn) {
            submitBtn.style.display = "none";
        }

        alert("আপনার অর্ডারটি গ্রহণ করা হয়েছে। আমাদের টিম ফোনে যোগাযোগ করবে।");

        setTimeout(() => {
            cart = [];
            updateCartUI();

            if (successMessage) {
                successMessage.style.display = "none";
            }

            if (submitBtn) {
                submitBtn.style.display = "block";
                submitBtn.disabled = false;
                submitBtn.innerText = "Confirm Place Order";
            }

            const form = getElement("orderForm");
            if (form) form.reset();

            if (currentUser && getElement("customerEmail")) {
                getElement("customerEmail").value = currentUser.email || "";
            }

            closeCheckoutModal();

        }, 3500);

    } catch (error) {
        console.error("Order error:", error);

        alert("অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Confirm Place Order";
        }
    }
}


/* ---------------- PRODUCT DETAILS ---------------- */

function openProductModal(productId) {
    const product = products.find(
        p => Number(p.id) === Number(productId)
    );

    if (!product) return;

    const image = getElement("modalProductImg");
    const name = getElement("modalProductName");
    const price = getElement("modalProductPrice");
    const category = getElement("modalCategory");
    const description = getElement("modalProductDesc");
    const modalBtn = getElement("modalAddToCartBtn");

    if (image) image.src = product.image;
    if (name) name.innerText = product.name;
    if (price) price.innerText = formatMoney(product.price);
    if (category) category.innerText = product.category || "GENERAL";

    if (description) {
        description.innerText = product.description ||
            "প্রিমিয়াম কোয়ালিটির এই পণ্যটি অত্যন্ত স্টাইলিশ এবং টেকসই।";
    }

    if (modalBtn) {
        modalBtn.onclick = function () {
            addToCart(product.id);
            closeProductModal();

            const drawer = getElement("cartDrawer");
            if (drawer) drawer.classList.add("open");
        };
    }

    const modal = getElement("productDetailModal");

    if (modal) modal.style.display = "flex";
}

function closeProductModal() {
    const modal = getElement("productDetailModal");
    if (modal) modal.style.display = "none";
}


/* ---------------- SHIPPING MODAL ---------------- */

function openShippingModal() {
    const modal = getElement("shippingModal");
    if (modal) modal.style.display = "block";
}

function closeShippingModal() {
    const modal = getElement("shippingModal");
    if (modal) modal.style.display = "none";
}


/* ---------------- ADMIN DASHBOARD DATA ---------------- */

function renderDashboardView() {
    if (!isAdminUser) return;

    const totalRevenue = orders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
    );

    const revenue = getElement("dashRevenue");
    const orderCount = getElement("dashOrdersCount");
    const productCount = getElement("dashProductsCount");

    if (revenue) revenue.innerText = formatMoney(totalRevenue);
    if (orderCount) orderCount.innerText = orders.length;
    if (productCount) productCount.innerText = products.length;

    const ordersTbody = getElement("dashOrdersTbody");

    if (ordersTbody) {
        if (orders.length === 0) {
            ordersTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;color:#888;">
                        No orders recorded yet.
                    </td>
                </tr>
            `;
        } else {
            ordersTbody.innerHTML = orders.map((order, index) => `
                <tr>
                    <td><strong>${escapeHTML(order.orderId)}</strong></td>

                    <td>
                        <div>
                            <strong>${escapeHTML(order.customerName)}</strong>
                            (${escapeHTML(order.customerPhone)})
                        </div>

                        <small style="color:#6b7280;display:block;">
                            ${escapeHTML(order.customerAddress)}
                        </small>

                        <small style="color:#059669;">
                            ${escapeHTML(order.itemsSummary || "Items")}
                            [${escapeHTML(order.payMethod || "COD")}]
                        </small>
                    </td>

                    <td>${escapeHTML(order.date)}</td>

                    <td><strong>${formatMoney(order.total)}</strong></td>

                    <td>
                        <select class="status-select" id="statusSelect_${index}">
                            <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
                            <option value="Paid" ${order.status === "Paid" ? "selected" : ""}>Paid</option>
                            <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
                            <option value="Cancelled" ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
                        </select>

                        <button class="status-save-btn"
                                onclick="saveOrderStatus(${index})">
                            Save
                        </button>
                    </td>

                    <td>
                        <button class="action-icon-btn"
                                onclick="deleteOrder(${index})"
                                title="Delete Order"
                                style="color:#ef4444;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join("");
        }
    }

    const invTbody = getElement("dashInventoryTbody");
    let lowStockCount = 0;

    if (invTbody) {
        invTbody.innerHTML = products.map((product, index) => {
            const stock = Number(product.stock ?? 10);
            const isLow = stock <= 10;

            if (isLow) lowStockCount++;

            return `
                <tr>
                    <td>
                        <div class="prod-cell-box">
                            <img src="${escapeHTML(product.image)}"
                                 class="prod-cell-img"
                                 onerror="this.src='https://via.placeholder.com/40';">

                            <span><strong>${escapeHTML(product.name)}</strong></span>
                        </div>
                    </td>

                    <td>${escapeHTML(product.category || "General")}</td>

                    <td>${formatMoney(product.price)}</td>

                    <td class="${isLow ? "text-low-stock" : ""}">
                        <strong>${stock}</strong>
                    </td>

                    <td>
                        <button class="stock-control-btn"
                                onclick="adjustStock(${index},-1)">-</button>

                        <span style="margin:0 8px;font-weight:600;">
                            ${stock}
                        </span>

                        <button class="stock-control-btn"
                                onclick="adjustStock(${index},1)">+</button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    const lowStockText = getElement("dashLowStockText");

    if (lowStockText) {
        lowStockText.innerText = `${lowStockCount} product(s) low on stock.`;
    }
}


/* ---------------- ADMIN ORDER MANAGEMENT ---------------- */

function saveOrderStatus(orderIndex) {
    if (!isAdminUser) return;

    const select = getElement(`statusSelect_${orderIndex}`);

    if (!select || !orders[orderIndex]) return;

    orders[orderIndex].status = select.value;

    saveOrdersToStorage();

    alert("Order status updated successfully!");

    renderDashboardView();
}

function deleteOrder(orderIndex) {
    if (!isAdminUser) return;

    if (!orders[orderIndex]) return;

    if (confirm("আপনি কি এই Order Delete করতে চান?")) {
        orders.splice(orderIndex, 1);

        saveOrdersToStorage();

        renderDashboardView();
    }
}

function adjustStock(productIndex, amount) {
    if (!isAdminUser) return;

    const product = products[productIndex];

    if (!product) return;

    const currentStock = Number(product.stock ?? 10);

    product.stock = Math.max(0, currentStock + amount);

    saveProductsToStorage();

    renderProducts(products);
    renderDashboardView();
}


/* ---------------- PRODUCT IMAGE UPLOAD ---------------- */

function handleFileSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("শুধুমাত্র Image File Upload করুন।");
        event.target.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Image Size 2 MB-এর কম রাখুন।");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        uploadedImageBase64 = e.target.result;
        updateAdminPreview();
    };

    reader.onerror = function () {
        alert("Image পড়তে সমস্যা হয়েছে।");
    };

    reader.readAsDataURL(file);
}


/* ---------------- PRODUCT PREVIEW ---------------- */

function updateAdminPreview() {
    const name = getElement("adminPName")?.value || "Product Title";

    const category = (
        getElement("adminPCategory")?.value || "CATEGORY"
    ).toUpperCase();

    const price = getElement("adminPPrice")?.value || "0.00";

    const prevName = getElement("prevName");
    const prevCategory = getElement("prevCategory");
    const prevPrice = getElement("prevPrice");
    const prevImg = getElement("prevImg");

    if (prevName) prevName.innerText = name;
    if (prevCategory) prevCategory.innerText = category;
    if (prevPrice) prevPrice.innerText = `৳${price}`;

    if (uploadedImageBase64 && prevImg) {
        prevImg.src = uploadedImageBase64;
    }
}


/* ---------------- SAVE PRODUCT ---------------- */

function handleSaveProduct(event) {
    event.preventDefault();

    if (!isAdminUser) {
        alert("Admin access required.");
        return;
    }

    const idInput = getElement("adminProductId")?.value;

    const name = getElement("adminPName")?.value.trim();

    const category = getElement("adminPCategory")?.value.trim() || "General";

    const price = Number(getElement("adminPPrice")?.value);

    const stock = Number(getElement("adminPStock")?.value);

    const description = getElement("adminPDesc")?.value.trim() || "";

    if (!name || !Number.isFinite(price) || price < 0) {
        alert("Product Name এবং সঠিক Price দিন।");
        return;
    }

    if (idInput) {
        const index = products.findIndex(
            product => Number(product.id) === Number(idInput)
        );

        if (index !== -1) {
            products[index] = {
                ...products[index],
                name,
                category,
                price,
                stock: Math.max(0, stock),
                description,
                image: uploadedImageBase64 || products[index].image
            };
        }

    } else {
        if (!uploadedImageBase64) {
            alert("প্রথমে Product Image Select করুন।");
            return;
        }

        products.push({
            id: Date.now(),
            name,
            category,
            price,
            stock: Math.max(0, stock),
            description,
            image: uploadedImageBase64
        });
    }

    saveProductsToStorage();

    renderProducts(products);
    renderDashboardView();
    renderAdminProductManageList();

    resetAdminForm();

    alert("Product সফলভাবে Save হয়েছে!");
}


/* ---------------- EDIT PRODUCT ---------------- */

function editProductInAdmin(productId) {
    if (!isAdminUser) return;

    const product = products.find(
        item => Number(item.id) === Number(productId)
    );

    if (!product) return;

    getElement("adminProductId").value = product.id;
    getElement("adminPName").value = product.name;
    getElement("adminPCategory").value = product.category || "";
    getElement("adminPPrice").value = product.price;
    getElement("adminPStock").value = product.stock ?? 10;
    getElement("adminPDesc").value = product.description || "";

    uploadedImageBase64 = product.image;

    const title = getElement("adminFormTitle");
    if (title) title.innerText = "Edit Product";

    updateAdminPreview();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ---------------- DELETE PRODUCT ---------------- */

function deleteProductInAdmin(productId) {
    if (!isAdminUser) return;

    if (!confirm("আপনি কি এই Product Delete করতে চান?")) return;

    products = products.filter(
        product => Number(product.id) !== Number(productId)
    );

    cart = cart.filter(
        item => Number(item.id) !== Number(productId)
    );

    saveProductsToStorage();

    renderProducts(products);
    renderAdminProductManageList();
    renderDashboardView();
    updateCartUI();
}


/* ---------------- RESET PRODUCT FORM ---------------- */

function resetAdminForm() {
    if (!isAdminUser) return;

    const form = getElement("adminProductForm");

    if (form) form.reset();

    const id = getElement("adminProductId");
    if (id) id.value = "";

    uploadedImageBase64 = null;

    const title = getElement("adminFormTitle");
    if (title) title.innerText = "Add / Edit Product";

    const preview = getElement("prevImg");

    if (preview) {
        preview.src = "https://via.placeholder.com/200?text=Image+Preview";
    }

    updateAdminPreview();
}


/* ---------------- ADMIN PRODUCT LIST ---------------- */

function renderAdminProductManageList() {
    const container = getElement("adminProductManageList");

    if (!container) return;

    if (!isAdminUser) {
        container.innerHTML = "";
        return;
    }

    if (products.length === 0) {
        container.innerHTML = `
            <p style="color:#888;">No products listed yet.</p>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="admin-prod-item">

            <span>
                <strong>${escapeHTML(product.name)}</strong>
                (${formatMoney(product.price)})
                — Stock: ${Number(product.stock ?? 10)}
            </span>

            <div>
                <button onclick="editProductInAdmin(${Number(product.id)})"
                        style="background:none;border:none;color:#27ae60;cursor:pointer;margin-right:10px;font-weight:600;">
                    Edit
                </button>

                <button onclick="deleteProductInAdmin(${Number(product.id)})"
                        style="background:none;border:none;color:#ef4444;cursor:pointer;font-weight:600;">
                    Delete
                </button>
            </div>

        </div>
    `).join("");
}


/* ---------------- CUSTOMER EMAIL ADMIN VIEW ---------------- */

function renderCustomerEmails() {
    if (!isAdminUser) return;

    const tbody = getElement("dashEmailsTbody");

    if (!tbody) return;

    if (customerEmails.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;color:#888;">
                    No customer emails recorded on this browser yet.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = customerEmails.map((customer, index) => `
        <tr>
            <td>${index + 1}</td>

            <td>${escapeHTML(customer.email)}</td>

            <td>${escapeHTML(customer.method || "Unknown")}</td>

            <td>${escapeHTML(customer.date || customer.lastLogin || "")}</td>

            <td>
                <button class="action-icon-btn"
                        onclick="deleteCustomerEmail(${index})"
                        style="color:#ef4444;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

function deleteCustomerEmail(index) {
    if (!isAdminUser) return;

    if (!customerEmails[index]) return;

    if (!confirm("এই Email List থেকে Remove করবেন?")) return;

    customerEmails.splice(index, 1);

    saveCustomerEmails();
    renderCustomerEmails();
}

function exportCustomerEmailsCSV() {
    if (!isAdminUser) return;

    if (customerEmails.length === 0) {
        alert("Export করার মতো Customer Email নেই।");
        return;
    }

    const rows = [
        ["Email", "Login Method", "Date", "Last Login"],
        ...customerEmails.map(item => [
            item.email,
            item.method || "",
            item.date || "",
            item.lastLogin || ""
        ])
    ];

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "SR_Prime_Mart_Customer_Emails.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}


/* ---------------- INITIAL PAGE SETUP ---------------- */

document.addEventListener("DOMContentLoaded", function () {

    saveProductsToStorage();
    saveOrdersToStorage();

    renderProducts(products);
    updateCartUI();

    const orderForm = getElement("orderForm");

    if (orderForm) {
        orderForm.addEventListener("submit", handleOrderSubmit);
    }

    const adminProductForm = getElement("adminProductForm");

    if (adminProductForm) {
        adminProductForm.addEventListener("submit", handleSaveProduct);
    }

    /* Close modal when clicking outside */

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });

    console.log("S.R. Prime Mart website loaded successfully.");
});


/* ---------------- MAKE FUNCTIONS AVAILABLE TO HTML ---------------- */

Object.assign(window, {
    openCustomerAuthModal,
    closeCustomerAuthModal,
    handleCustomerEmailLogin,
    handleCustomerRegister,
    handleGoogleLogin,
    handleForgotPassword,

    openAdminDashboardFromTop,
    openAdminDashboard,
    closeAdminDashboard,
    switchAdminTab,

    searchProducts,
    filterByCategory,

    addToCart,
    decreaseQty,
    removeFromCart,
    directBuyNow,
    toggleCartDrawer,

    openCheckoutModal,
    closeCheckoutModal,
    calculateFinalTotal,

    openProductModal,
    closeProductModal,

    openShippingModal,
    closeShippingModal,

    handleFileSelect,
    updateAdminPreview,
    handleSaveProduct,
    editProductInAdmin,
    deleteProductInAdmin,
    resetAdminForm,

    renderAdminProductManageList,
    renderDashboardView,
    adjustStock,
    saveOrderStatus,
    deleteOrder,

    renderCustomerEmails,
    deleteCustomerEmail,
    exportCustomerEmailsCSV
});
