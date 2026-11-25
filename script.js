/* =========================================================
   S.R. PRIME MART
   Firebase Authentication + Firestore Products + Orders
   Cloudflare Worker Image Upload
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
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ---------------- CONFIGURATION ---------------- */

const firebaseConfig = {
    apiKey: "AIzaSyCysJRNg1OsWNjCnyx9b-3xGJmuFJMJVT8",
    authDomain: "srprimemart-177c5.firebaseapp.com",
    projectId: "srprimemart-177c5",
    storageBucket: "srprimemart-177c5.firebasestorage.app",
    messagingSenderId: "132024731701",
    appId: "1:132024731701:web:877ef144c03731454b497c",
    measurementId: "G-RLPXZEW6PH"
};

const PLACEHOLDER_PRODUCT_IMG = "https://via.placeholder.com/300?text=Product+Image";
const PLACEHOLDER_PREVIEW_IMG = "https://via.placeholder.com/200?text=Image+Preview";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const ADMIN_UID = "VJvdQjS0ygSx46SnLqcyPx49mi02";

const IMAGE_UPLOAD_URL =
    "https://sr-prime-mart-upload.srprimemart2026.workers.dev/";

let currentUser = null;
let isAdminUser = false;

let products = [];
let orders = [];
let cart = [];

let customerEmails = [];
let selectedImageFile = null;
let uploadedImageBase64 = null;

let productsLoaded = false;
let ordersLoaded = false;
let migrationStarted = false;

let unsubscribeProducts = null;
let unsubscribeOrders = null;
let unsubscribeEmails = null;


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
        console.error(error);
        return fallback;
    }
}

const localProducts = loadStorage("sr_products_v9", defaultProducts);
orders = loadStorage("sr_orders_v9", []);
customerEmails = loadStorage("sr_customer_emails_v1", []);
cart = loadStorage("sr_cart_v1", []);

function saveProductsToStorage() {
    localStorage.setItem("sr_products_v9", JSON.stringify(products));
}

function saveOrdersToStorage() {
    localStorage.setItem("sr_orders_v9", JSON.stringify(orders));
}

function saveCustomerEmails() {
    localStorage.setItem("sr_customer_emails_v1", JSON.stringify(customerEmails));
}

function saveCartToStorage() {
    localStorage.setItem("sr_cart_v1", JSON.stringify(cart));
}


/* ---------------- COMMON HELPERS ---------------- */

function getElement(id) {
    return document.getElementById(id);
}

function formatMoney(amount) {
    return "৳" + Number(amount || 0).toLocaleString("en-US");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function sameId(a, b) {
    return String(a) === String(b);
}

function showAuthError(error) {
    console.error(error);

    const messages = {
        "auth/email-already-in-use": "এই Email দিয়ে আগে থেকেই Account তৈরি করা আছে।",
        "auth/invalid-email": "সঠিক Email Address দিন।",
        "auth/weak-password": "Password কমপক্ষে ৬ অক্ষরের হতে হবে।",
        "auth/invalid-credential": "Email অথবা Password সঠিক নয়।",
        "auth/user-not-found": "এই Email দিয়ে কোনো Account পাওয়া যায়নি।",
        "auth/wrong-password": "Password সঠিক নয়।",
        "auth/popup-closed-by-user": "Google Login বন্ধ করা হয়েছে।",
        "auth/popup-blocked": "Browser Popup Block করেছে।",
        "auth/network-request-failed": "Internet Connection পরীক্ষা করুন।",
        "auth/too-many-requests": "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
        "auth/unauthorized-domain": "Firebase Console-এ Website Domain Authorized করতে হবে।"
    };

    alert(messages[error.code] || error.message || "একটি সমস্যা হয়েছে।");
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
            email,
            method,
            date: new Date().toLocaleString(),
            lastLogin: new Date().toLocaleString()
        });
    }

    saveCustomerEmails();

    if (isAdminUser) {
        syncCustomerEmails();
    }
}


/* ---------------- FIRESTORE PRODUCT SYNC ---------------- */

async function migrateLocalProductsIfNeeded(snapshot) {
    if (migrationStarted || !isAdminUser) return;

    const onlyTestProduct =
        snapshot.size === 1 &&
        snapshot.docs[0].data().name === "Test Product";

    if (snapshot.size !== 0 && !onlyTestProduct) return;

    migrationStarted = true;

    try {
        const sourceProducts = Array.isArray(localProducts)
            ? localProducts
            : defaultProducts;

        for (const product of sourceProducts) {
            const productData = {
                name: product.name || "Product",
                category: product.category || "General",
                price: Number(product.price || 0),
                stock: Number(product.stock ?? 0),
                description: product.description || "",
                image: product.image || "",
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "products"), productData);
        }

        if (onlyTestProduct) {
            await deleteDoc(doc(db, "products", snapshot.docs[0].id));
        }

        alert("আগের প্রোডাক্টগুলো Firebase-এ সংরক্ষণ করা হয়েছে।");

    } catch (error) {
        console.error("Product migration error:", error);
        alert("পুরোনো প্রোডাক্ট Firebase-এ নেওয়া যায়নি। " + error.message);
    }
}

function syncCartWithProducts() {
    if (!productsLoaded) return;

    let changed = false;
    cart = cart
        .map(item => {
            const latest = products.find(p => sameId(p.id, item.id));
            if (!latest) {
                changed = true;
                return null;
            }
            const maxStock = Math.max(0, Number(latest.stock ?? 0));
            const nextQty = Math.min(Number(item.quantity || 1), maxStock);
            if (nextQty <= 0) {
                changed = true;
                return null;
            }
            if (
                nextQty !== item.quantity ||
                Number(latest.price) !== Number(item.price) ||
                latest.name !== item.name ||
                latest.image !== item.image
            ) {
                changed = true;
            }
            return {
                ...latest,
                quantity: nextQty
            };
        })
        .filter(Boolean);

    if (changed) {
        saveCartToStorage();
    }
}

function startProductsListener() {
    if (unsubscribeProducts) unsubscribeProducts();

    unsubscribeProducts = onSnapshot(
        collection(db, "products"),
        async snapshot => {
            if (!migrationStarted && isAdminUser) {
                await migrateLocalProductsIfNeeded(snapshot);
            }

            products = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            productsLoaded = true;

            saveProductsToStorage();
            syncCartWithProducts();
            renderProducts(products);
            updateCartUI();
            renderDashboardView();
            renderAdminProductManageList();
        },
        error => {
            console.error("Products listener error:", error);
            alert("Firebase থেকে Product লোড করা যায়নি: " + error.message);
        }
    );
}


/* ---------------- FIRESTORE ORDERS ---------------- */

function startOrdersListener() {
    if (unsubscribeOrders) unsubscribeOrders();

    if (!isAdminUser) {
        orders = [];
        renderDashboardView();
        return;
    }

    const ordersQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
    );

    unsubscribeOrders = onSnapshot(
        ordersQuery,
        snapshot => {
            orders = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            ordersLoaded = true;
            saveOrdersToStorage();
            renderDashboardView();
        },
        error => {
            console.error("Orders listener error:", error);
            alert("Orders লোড করা যায়নি: " + error.message);
        }
    );
}


/* ---------------- CUSTOMER EMAIL FIRESTORE SYNC ---------------- */

async function syncCustomerEmails() {
    if (!isAdminUser) return;

    try {
        const ref = doc(db, "customerEmails", currentUser.uid);

        await setDoc(ref, {
            emails: customerEmails,
            updatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Customer email sync error:", error);
    }
}

function startCustomerEmailsListener() {
    if (unsubscribeEmails) unsubscribeEmails();

    if (!isAdminUser) return;

    unsubscribeEmails = onSnapshot(
        collection(db, "customerEmails"),
        snapshot => {
            let combined = [];

            snapshot.forEach(item => {
                const data = item.data();
                if (Array.isArray(data.emails)) {
                    combined = combined.concat(data.emails);
                }
            });

            const unique = new Map();

            combined.forEach(item => {
                if (item.email) unique.set(item.email, item);
            });

            customerEmails = Array.from(unique.values());
            saveCustomerEmails();
            renderCustomerEmails();
        },
        error => console.error("Email listener error:", error)
    );
}


/* ---------------- AUTHENTICATION STATE ---------------- */

onAuthStateChanged(auth, user => {
    currentUser = user;
    isAdminUser = !!user && user.uid === ADMIN_UID;

    const authText = getElement("userAuthText");
    const adminButton = getElement("adminPanelTopBtn");
    const customerEmailInput = getElement("customerEmail");

    if (user) {
        if (authText) authText.textContent = "Logout";
        if (customerEmailInput) customerEmailInput.value = user.email || "";
        if (adminButton) adminButton.style.display = isAdminUser ? "inline-block" : "none";

        saveCustomerEmail(user, "Login");

        if (isAdminUser) {
            startOrdersListener();
            startCustomerEmailsListener();
        } else {
            if (unsubscribeOrders) unsubscribeOrders();
            if (unsubscribeEmails) unsubscribeEmails();
            orders = [];
        }

    } else {
        if (authText) authText.textContent = "Login / Register";
        if (customerEmailInput) customerEmailInput.value = "";
        if (adminButton) adminButton.style.display = "none";

        if (unsubscribeOrders) unsubscribeOrders();
        if (unsubscribeEmails) unsubscribeEmails();

        orders = [];
    }

    startProductsListener();
});


/* ---------------- CUSTOMER AUTH MODAL ---------------- */

function openCustomerAuthModal() {
    if (currentUser) {
        if (confirm("আপনি কি Logout করতে চান?")) {
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

async function handleCustomerEmailLogin(event) {
    if (event) event.preventDefault();

    const email = getElement("custModalEmail")?.value.trim();
    const password = getElement("custModalPass")?.value;

    if (!email || !password) {
        alert("Email এবং Password দিন।");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        closeCustomerAuthModal();
        alert("Login সফল হয়েছে। Welcome to S.R. Prime Mart!");
    } catch (error) {
        showAuthError(error);
    }
}

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
        await createUserWithEmailAndPassword(auth, email, password);
        closeCustomerAuthModal();
        alert("আপনার Account সফলভাবে তৈরি হয়েছে!");
    } catch (error) {
        showAuthError(error);
    }
}

async function handleGoogleLogin() {
    try {
        await signInWithPopup(auth, googleProvider);
        closeCustomerAuthModal();
        alert("Google Login সফল হয়েছে!");
    } catch (error) {
        showAuthError(error);
    }
}

async function handleForgotPassword() {
    const email = getElement("custModalEmail")?.value.trim();

    if (!email) {
        alert("প্রথমে Email Address লিখুন।");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password Reset Link আপনার Email-এ পাঠানো হয়েছে। Inbox এবং Spam Folder দেখুন।");
    } catch (error) {
        showAuthError(error);
    }
}


/* ---------------- ADMIN DASHBOARD ---------------- */

function openAdminDashboardFromTop() {
    if (!isAdminUser) {
        alert("আপনার Admin Access নেই।");
        return;
    }

    openAdminDashboard();
}

function openAdminDashboard() {
    if (!isAdminUser) {
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

function switchAdminTab(tab) {
    if (!isAdminUser) return;

    const views = [
        getElement("adminDashboardView"),
        getElement("adminProductsView"),
        getElement("adminEmailsView")
    ];

    const buttons = [
        getElement("btnTabDashboard"),
        getElement("btnTabProducts"),
        getElement("btnTabEmails")
    ];

    views.forEach(item => {
        if (item) item.style.display = "none";
    });

    buttons.forEach(item => {
        if (item) item.classList.remove("active");
    });

    const index = tab === "products" ? 1 : tab === "emails" ? 2 : 0;

    if (views[index]) views[index].style.display = "block";
    if (buttons[index]) buttons[index].classList.add("active");

    if (index === 1) renderAdminProductManageList();
    if (index === 2) renderCustomerEmails();
    if (index === 0) renderDashboardView();
}


/* ---------------- PRODUCT RENDERING ---------------- */

function renderProducts(items) {
    const container = getElement("product-container");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <p style="grid-column:1/-1;text-align:center;color:#888;">
                No products available!
            </p>`;
        return;
    }

    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div class="image-box-wrapper">
                <div class="image-box"
                     onclick='openProductModal(${JSON.stringify(String(product.id))})'
                     title="Click to view details">
                    <img src="${escapeHTML(product.image || "")}"
                         alt="${escapeHTML(product.name)}"
                         onerror="this.onerror=null;this.src='${PLACEHOLDER_PRODUCT_IMG}';">
                </div>
            </div>

            <div class="product-category">
                ${escapeHTML(product.category || "GENERAL")}
            </div>

            <div class="product-title"
                 onclick='openProductModal(${JSON.stringify(String(product.id))})'
                 title="${escapeHTML(product.name)}">
                ${escapeHTML(product.name)}
            </div>

            <div class="price-buy-row" style="margin-top:10px;">
                <div>
                    <span class="product-price">${formatMoney(product.price)}</span>
                </div>

                <button type="button" class="buy-btn"
                        onclick='directBuyNow(${JSON.stringify(String(product.id))})'>
                    Buy
                </button>
            </div>
        </div>
    `).join("");
}

function searchProducts() {
    const queryText = (getElement("searchInput")?.value || "").toLowerCase().trim();

    if (!queryText) {
        renderProducts(products);
        return;
    }

    renderProducts(products.filter(product =>
        (product.name || "").toLowerCase().includes(queryText) ||
        (product.category || "").toLowerCase().includes(queryText)
    ));
}

function filterByCategory(category) {
    if (!category || category.toLowerCase() === "all") {
        renderProducts(products);
        return;
    }

    renderProducts(products.filter(product =>
        (product.category || "").toLowerCase() === category.toLowerCase()
    ));
}


/* ---------------- CART SYSTEM ---------------- */

function addToCart(productId) {
    const product = products.find(item => sameId(item.id, productId));
    if (!product) return;

    const currentStock = Number(product.stock ?? 0);
    if (currentStock <= 0) {
        alert("এই Product-টি বর্তমানে Stock-এ নেই।");
        return;
    }

    const existingItem = cart.find(item => sameId(item.id, productId));
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity >= currentStock) {
        alert("এই Product-এর পর্যাপ্ত Stock নেই।");
        return;
    }

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCartToStorage();
    updateCartUI();
}

function directBuyNow(productId) {
    addToCart(productId);

    const drawer = getElement("cartDrawer");
    if (drawer && cart.length > 0) drawer.classList.add("open");
}

function decreaseQty(productId) {
    const item = cart.find(i => sameId(i.id, productId));
    if (!item) return;

    item.quantity--;

    if (item.quantity <= 0) {
        cart = cart.filter(i => !sameId(i.id, productId));
    }

    saveCartToStorage();
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(i => !sameId(i.id, productId));
    saveCartToStorage();
    updateCartUI();
}

function toggleCartDrawer() {
    const drawer = getElement("cartDrawer");
    if (drawer) drawer.classList.toggle("open");
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
                </p>`;
        } else {
            drawerItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item-card">
                    <img src="${escapeHTML(item.image || "")}"
                         alt="${escapeHTML(item.name)}"
                         class="cart-item-img"
                         onerror="this.src='https://via.placeholder.com/60';">

                    <div class="cart-item-details">
                        <div class="cart-item-title">${escapeHTML(item.name)}</div>

                        <div class="cart-item-bottom">
                            <span class="cart-item-price">${formatMoney(item.price)}</span>

                            <div class="cart-qty-controls">
                                <button type="button" class="q-btn"
                                        onclick='decreaseQty(${JSON.stringify(String(item.id))})'>-</button>

                                <span>${item.quantity}</span>

                                <button type="button" class="q-btn"
                                        onclick='addToCart(${JSON.stringify(String(item.id))})'>+</button>

                                <i class="fa-solid fa-trash-can delete-btn"
                                   onclick='removeFromCart(${JSON.stringify(String(item.id))})'></i>
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
    if (emailInput) emailInput.value = currentUser.email || "";

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
    if (modalSubtotal) modalSubtotal.innerText = `BDT ${subtotal}`;

    if (checkoutItemsList) {
        checkoutItemsList.innerHTML = cart.map(item => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;border-bottom:1px solid #f3f4f6;padding-bottom:10px;">
                <img src="${escapeHTML(item.image || "")}"
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
    const deliveryFee = deliverySelect ? Number(deliverySelect.value) : 70;

    const modalDeliveryFee = getElement("modalDeliveryFee");
    const modalGrandTotal = getElement("modalGrandTotal");

    if (modalDeliveryFee) modalDeliveryFee.innerText = `BDT ${deliveryFee}`;
    if (modalGrandTotal) modalGrandTotal.innerText = `BDT ${subtotal + deliveryFee}`;

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

    for (const item of cart) {
        const product = products.find(p => sameId(p.id, item.id));

        if (!product || Number(product.stock ?? 0) < item.quantity) {
            alert(`${item.name} - পর্যাপ্ত Stock নেই।`);
            return;
        }
    }

    const totals = calculateFinalTotal();

    const submitBtn = getElement("submitBtn");
    const successMessage = getElement("successMessage");

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing...";
    }

    try {
        const orderData = {
            orderId: "SR-" + Date.now(),
            userId: currentUser.uid,
            customerName,
            customerEmail: currentUser.email || "",
            customerPhone,
            customerAddress,
            payMethod: paymentMethod,
            itemsSummary: cart.map(item =>
                `${item.name} (x${item.quantity})`
            ).join(", "),
            items: cart.map(item => ({
                id: String(item.id),
                name: item.name,
                price: Number(item.price),
                quantity: item.quantity
            })),
            subtotal: totals.subtotal,
            deliveryFee: totals.deliveryFee,
            total: totals.grandTotal,
            date: new Date().toLocaleString(),
            createdAt: new Date().toISOString(),
            status: "Pending"
        };

        await addDoc(collection(db, "orders"), orderData);

        for (const item of cart) {
            const product = products.find(p => sameId(p.id, item.id));

            if (product) {
                await updateDoc(doc(db, "products", String(product.id)), {
                    stock: Math.max(0, Number(product.stock || 0) - item.quantity)
                });
            }
        }

        saveCustomerEmail(currentUser, "Order");

        if (successMessage) {
            successMessage.style.display = "block";
        }

        if (submitBtn) submitBtn.style.display = "none";

        alert("আপনার অর্ডারটি গ্রহণ করা হয়েছে। আমাদের টিম ফোনে যোগাযোগ করবে।");

        setTimeout(() => {
            cart = [];
            saveCartToStorage();
            updateCartUI();

            if (successMessage) successMessage.style.display = "none";

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
        }, 3000);

    } catch (error) {
        console.error("Order submission error:", error);

        alert("অর্ডার Firebase-এ সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Confirm Place Order";
        }
    }
}


/* ---------------- PRODUCT DETAILS ---------------- */

function openProductModal(productId) {
    const product = products.find(p => sameId(p.id, productId));
    if (!product) return;

    const image = getElement("modalProductImg");
    const name = getElement("modalProductName");
    const price = getElement("modalProductPrice");
    const category = getElement("modalCategory");
    const description = getElement("modalProductDesc");
    const modalBtn = getElement("modalAddToCartBtn");

    if (image) image.src = product.image || "";
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
                <tr><td colspan="6" style="text-align:center;color:#888;">
                    No orders recorded yet.
                </td></tr>`;
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
                    <td>${escapeHTML(order.date || "")}</td>
                    <td><strong>${formatMoney(order.total)}</strong></td>
                    <td>
                        <select class="status-select" id="statusSelect_${index}">
                            <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
                            <option value="Paid" ${order.status === "Paid" ? "selected" : ""}>Paid</option>
                            <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
                            <option value="Cancelled" ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
                        </select>
                        <button type="button" class="status-save-btn"
                                onclick="saveOrderStatus(${index})">Save</button>
                    </td>
                    <td>
                        <button type="button" class="action-icon-btn"
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
        invTbody.innerHTML = products.map(product => {
            const stock = Number(product.stock ?? 0);
            const isLow = stock <= 10;
            if (isLow) lowStockCount++;

            return `
                <tr>
                    <td>
                        <div class="prod-cell-box">
                            <img src="${escapeHTML(product.image || "")}"
                                 class="prod-cell-img"
                                 onerror="this.src='https://via.placeholder.com/40';">
                            <span><strong>${escapeHTML(product.name)}</strong></span>
                        </div>
                    </td>
                    <td>${escapeHTML(product.category || "General")}</td>
                    <td>${formatMoney(product.price)}</td>
                    <td class="${isLow ? "text-low-stock" : ""}">
                        <strong>${stock > 0 ? stock : "Out of Stock (0)"}</strong>
                    </td>
                    <td>
                        <button type="button" class="stock-control-btn"
                                onclick='adjustStock(${JSON.stringify(String(product.id))},-1)'>-</button>
                        <span style="margin:0 8px;font-weight:600;">${stock}</span>
                        <button type="button" class="stock-control-btn"
                                onclick='adjustStock(${JSON.stringify(String(product.id))},1)'>+</button>
                    </td>
                </tr>`;
        }).join("");
    }

    const lowStockText = getElement("dashLowStockText");
    if (lowStockText) {
        lowStockText.innerText = `${lowStockCount} product(s) low on stock.`;
    }
}


/* ---------------- ADMIN ORDER MANAGEMENT ---------------- */

async function saveOrderStatus(orderIndex) {
    if (!isAdminUser) return;

    const order = orders[orderIndex];
    const select = getElement(`statusSelect_${orderIndex}`);

    if (!order || !select || !order.id) return;

    try {
        await updateDoc(doc(db, "orders", order.id), {
            status: select.value
        });

        alert("Order status updated successfully!");
    } catch (error) {
        console.error(error);
        alert("Order status update করা যায়নি: " + error.message);
    }
}

async function deleteOrder(orderIndex) {
    if (!isAdminUser) return;

    const order = orders[orderIndex];
    if (!order || !order.id) return;

    if (!confirm("আপনি কি এই Order Delete করতে চান?")) return;

    try {
        await deleteDoc(doc(db, "orders", order.id));
    } catch (error) {
        console.error(error);
        alert("Order Delete করা যায়নি: " + error.message);
    }
}

async function adjustStock(productId, amount) {
    if (!isAdminUser) return;

    const product = products.find(p => sameId(p.id, productId));
    if (!product) return;

    const newStock = Math.max(0, Number(product.stock || 0) + amount);

    try {
        await updateDoc(doc(db, "products", String(product.id)), {
            stock: newStock
        });
    } catch (error) {
        console.error(error);
        alert("Stock Update করা যায়নি: " + error.message);
    }
}


/* ---------------- IMAGE FILE SELECT ---------------- */

function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
        alert("শুধুমাত্র JPG, PNG অথবা WEBP Image Upload করুন।");
        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Image Size 5 MB-এর কম রাখুন।");
        event.target.value = "";
        return;
    }

    selectedImageFile = file;

    const reader = new FileReader();

    reader.onload = function (e) {
        uploadedImageBase64 = e.target.result;
        updateAdminPreview();
    };

    reader.onerror = function () {
        alert("Image পড়তে সমস্যা হয়েছে।");
    };

    reader.readAsDataURL(file);
}


/* ---------------- CLOUDFLARE WORKER IMAGE UPLOAD ---------------- */

async function uploadProductImage(file) {
    if (!currentUser || !isAdminUser) {
        throw new Error("Admin login পাওয়া যায়নি।");
    }

    const idToken = await currentUser.getIdToken();

    const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const dataURL = reader.result;
            resolve(String(dataURL).split(",")[1]);
        };

        reader.onerror = () => reject(new Error("Image পড়া যায়নি।"));
        reader.readAsDataURL(file);
    });

    const safeFilename = file.name
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-");

    const response = await fetch(IMAGE_UPLOAD_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
            filename: `${Date.now()}-${safeFilename}`,
            contentType: file.type,
            imageBase64: base64Data
        })
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.imageURL) {
        throw new Error(result.error || "Image Upload ব্যর্থ হয়েছে।");
    }

    return result.imageURL;
}


/* ---------------- PRODUCT PREVIEW ---------------- */

function updateAdminPreview() {
    const name = getElement("adminPName")?.value || "Product Title";
    const category = (getElement("adminPCategory")?.value || "CATEGORY").toUpperCase();
    const price = getElement("adminPPrice")?.value || "0.00";

    const prevName = getElement("prevName");
    const prevCategory = getElement("prevCategory");
    const prevPrice = getElement("prevPrice");
    const prevImg = getElement("prevImg");

    if (prevName) prevName.innerText = name;
    if (prevCategory) prevCategory.innerText = category;
    if (prevPrice) prevPrice.innerText = `৳${price}`;

    if (prevImg) {
        prevImg.src = uploadedImageBase64 || PLACEHOLDER_PREVIEW_IMG;
    }
}


/* ---------------- SAVE PRODUCT TO FIRESTORE ---------------- */

async function handleSaveProduct(event) {
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

    if (!Number.isFinite(stock) || stock < 0) {
        alert("সঠিক Stock সংখ্যা দিন।");
        return;
    }

    const saveButton = getElement("adminProductForm")?.querySelector('[type="submit"]');

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerText = "Saving...";
    }

    try {
        let imageURL = "";

        if (selectedImageFile) {
            imageURL = await uploadProductImage(selectedImageFile);
        }

        const productData = {
            name,
            category,
            price,
            stock,
            description,
            updatedAt: new Date().toISOString()
        };

        if (idInput) {
            const existing = products.find(p => sameId(p.id, idInput));

            if (!existing) {
                throw new Error("এই Product আর পাওয়া যাচ্ছে না।");
            }

            productData.image = imageURL || existing.image || "";

            await updateDoc(
                doc(db, "products", String(idInput)),
                productData
            );

        } else {
            if (!imageURL) {
                alert("নতুন Product-এর জন্য প্রথমে Image Select করুন।");
                return;
            }

            productData.image = imageURL;
            productData.createdAt = new Date().toISOString();

            await addDoc(collection(db, "products"), productData);
        }

        resetAdminForm();
        alert("Product সফলভাবে Firebase-এ Save হয়েছে!");

    } catch (error) {
        console.error("Product save error:", error);
        alert("Product Save করা যায়নি: " + error.message);

    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerText = "Save Product";
        }
    }
}


/* ---------------- EDIT PRODUCT ---------------- */

function editProductInAdmin(productId) {
    if (!isAdminUser) return;

    const product = products.find(item => sameId(item.id, productId));
    if (!product) return;

    getElement("adminProductId").value = product.id;
    getElement("adminPName").value = product.name;
    getElement("adminPCategory").value = product.category || "";
    getElement("adminPPrice").value = product.price;
    getElement("adminPStock").value = product.stock ?? 0;
    getElement("adminPDesc").value = product.description || "";

    selectedImageFile = null;
    uploadedImageBase64 = product.image || "";

    const title = getElement("adminFormTitle");
    if (title) title.innerText = "Edit Product";

    updateAdminPreview();

    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ---------------- DELETE PRODUCT ---------------- */

async function deleteProductInAdmin(productId) {
    if (!isAdminUser) return;

    if (!confirm("আপনি কি এই Product Delete করতে চান?")) return;

    try {
        await deleteDoc(doc(db, "products", String(productId)));

        cart = cart.filter(item => !sameId(item.id, productId));
        saveCartToStorage();
        updateCartUI();

        alert("Product Delete করা হয়েছে।");

    } catch (error) {
        console.error(error);
        alert("Product Delete করা যায়নি: " + error.message);
    }
}


/* ---------------- RESET PRODUCT FORM ---------------- */

function resetAdminForm() {
    if (!isAdminUser) return;

    const form = getElement("adminProductForm");
    if (form) form.reset();

    const id = getElement("adminProductId");
    if (id) id.value = "";

    selectedImageFile = null;
    uploadedImageBase64 = null;

    const title = getElement("adminFormTitle");
    if (title) title.innerText = "Add / Edit Product";

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
        container.innerHTML = `<p style="color:#888;">No products listed yet.</p>`;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="admin-prod-item">
            <span>
                <strong>${escapeHTML(product.name)}</strong>
                (${formatMoney(product.price)})
                — Stock: ${Number(product.stock ?? 0)}
            </span>

            <div>
                <button type="button" onclick='editProductInAdmin(${JSON.stringify(String(product.id))})'
                        style="background:none;border:none;color:#27ae60;cursor:pointer;margin-right:10px;font-weight:600;">
                    Edit
                </button>

                <button type="button" onclick='deleteProductInAdmin(${JSON.stringify(String(product.id))})'
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
                    No customer emails recorded yet.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = customerEmails.map((customer, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(customer.email)}</td>
            <td>${escapeHTML(customer.method || "Unknown")}</td>
            <td>${escapeHTML(customer.date || customer.lastLogin || "")}</td>
            <td>
                <button type="button" class="action-icon-btn"
                        onclick="deleteCustomerEmail(${index})"
                        style="color:#ef4444;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

function deleteCustomerEmail(index) {
    if (!isAdminUser || !customerEmails[index]) return;

    if (!confirm("এই Email List থেকে Remove করবেন?")) return;

    customerEmails.splice(index, 1);
    saveCustomerEmails();
    syncCustomerEmails();
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
        row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

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

    const deliverySelect = getElement("deliveryLocation");
    if (deliverySelect) {
        deliverySelect.addEventListener("change", calculateFinalTotal);
    }

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });

    console.log("S.R. Prime Mart Firebase website loaded.");
});


/* ---------------- HTML FUNCTION ACCESS ---------------- */

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
