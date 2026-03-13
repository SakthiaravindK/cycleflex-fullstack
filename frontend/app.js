const API_BASE = "https://cycleflex-fullstack.onrender.com/api";

/* =========================
   SESSION HELPERS
========================= */
function getToken() {
  return localStorage.getItem("cycleflex_token") || "";
}

function getUser() {
  try {
    const raw = localStorage.getItem("cycleflex_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem("cycleflex_token", token);
  localStorage.setItem("cycleflex_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("cycleflex_token");
  localStorage.removeItem("cycleflex_user");
}

function logout() {
  clearSession();
  location.href = "login.html";
}

function requireLogin(redirect = true) {
  const token = getToken();
  if (!token) {
    if (redirect) {
      alert("Please login first.");
      location.href = "login.html";
    }
    return false;
  }
  return true;
}

/* =========================
   API HELPER
========================= */
async function api(path, options = {}) {
  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken() ? `Bearer ${getToken()}` : ""
    }
  };

  if (options.headers) {
    config.headers = { ...config.headers, ...options.headers };
  }

  if (options.body) {
    config.body = options.body;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, config);
  } catch {
    throw new Error("Unable to connect to server. Please try again later.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

/* =========================
   NAVBAR
========================= */
function updateNav() {
  const navUser = document.getElementById("navUser");
  const navAuth = document.getElementById("navAuth");
  const user = getUser();

  if (navUser) {
    navUser.textContent = user ? `Hi, ${user.name}` : "Guest";
  }

  if (navAuth) {
    navAuth.innerHTML = user
      ? `<button class="btn btn-outline" onclick="logout()">Logout</button>`
      : `<a href="login.html" class="btn btn-outline">Login</a>`;
  }
}

/* =========================
   PRODUCTS
========================= */
async function loadProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading products...</p>`;

  try {
    const products = await api("/products");

    if (!products || !products.length) {
      grid.innerHTML = `<p class="muted">No products available.</p>`;
      return;
    }

    grid.innerHTML = products
      .map(
        (p) => `
        <div class="card">
          <img src="${p.image}" alt="${p.title}" />
          <div class="card-body">
            <h3>${p.title}</h3>
            <p>${p.description || "Premium cycling shorts designed for comfort and performance."}</p>
            <div class="price">₹${p.price}</div>
            <div class="row">
              <select class="select" id="size-${p._id}">
                ${(p.sizes || ["S", "M", "L", "XL"])
                  .map((s) => `<option value="${s}">${s}</option>`)
                  .join("")}
              </select>
              <button class="btn" onclick="addToCart('${p._id}')">Add to Cart</button>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<p class="muted">${err.message}</p>`;
  }
}

async function addToCart(productId) {
  try {
    if (!requireLogin()) return;

    const size = document.getElementById(`size-${productId}`)?.value || "M";

    await api("/cart/add", {
      method: "POST",
      body: JSON.stringify({
        productId,
        size,
        quantity: 1
      })
    });

    alert("Added to cart successfully.");
  } catch (err) {
    alert(err.message);
  }
}

/* =========================
   CART
========================= */
async function loadCart() {
  const cartWrap = document.getElementById("cartWrap");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartWrap) return;

  if (!getToken()) {
    cartWrap.innerHTML = `<p class="muted">Please login to view your cart.</p>`;
    if (cartTotal) cartTotal.textContent = "₹0";
    return;
  }

  cartWrap.innerHTML = `<p class="muted">Loading cart...</p>`;

  try {
    const items = await api("/cart");

    if (!items || !items.length) {
      cartWrap.innerHTML = `<p class="muted">Your cart is empty.</p>`;
      if (cartTotal) cartTotal.textContent = "₹0";
      return;
    }

    let total = 0;

    cartWrap.innerHTML = items
      .map((item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        total += itemTotal;

        return `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" />
            <div style="flex:1">
              <h3>${item.title}</h3>
              <p class="muted">Size: ${item.size} | Qty: ${item.quantity}</p>
              <div class="price">₹${item.price}</div>
            </div>
            <button class="btn btn-outline" onclick="removeFromCart('${item.productId}','${item.size}')">Remove</button>
          </div>
        `;
      })
      .join("");

    if (cartTotal) {
      cartTotal.textContent = `₹${total}`;
    }
  } catch (err) {
    cartWrap.innerHTML = `<p class="muted">${err.message}</p>`;
    if (cartTotal) cartTotal.textContent = "₹0";
  }
}

async function removeFromCart(productId, size) {
  try {
    if (!requireLogin()) return;

    await api("/cart/remove", {
      method: "POST",
      body: JSON.stringify({ productId, size })
    });

    await loadCart();
  } catch (err) {
    alert(err.message);
  }
}

/* =========================
   AUTH
========================= */
async function handleSignup(e) {
  e.preventDefault();

  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const password = document.getElementById("signupPassword")?.value;
  const msg = document.getElementById("signupMsg");

  if (msg) msg.textContent = "";

  try {
    if (!name || !email || !password) {
      throw new Error("Please fill all fields.");
    }

    const data = await api("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    setSession(data.token, data.user);
    location.href = "products.html";
  } catch (err) {
    if (msg) msg.textContent = err.message;
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;
  const msg = document.getElementById("loginMsg");

  if (msg) msg.textContent = "";

  try {
    if (!email || !password) {
      throw new Error("Please enter email and password.");
    }

    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    setSession(data.token, data.user);
    location.href = "products.html";
  } catch (err) {
    if (msg) msg.textContent = err.message;
  }
}

/* =========================
   CHECKOUT
========================= */
async function handleCheckout(e) {
  e.preventDefault();

  const msg = document.getElementById("checkoutMsg");
  if (msg) msg.textContent = "";

  try {
    if (!requireLogin()) return;

    const shipping = {
      fullName: document.getElementById("fullName")?.value.trim(),
      phone: document.getElementById("phone")?.value.trim(),
      address: document.getElementById("address")?.value.trim(),
      city: document.getElementById("city")?.value.trim(),
      state: document.getElementById("state")?.value.trim(),
      pincode: document.getElementById("pincode")?.value.trim()
    };

    const paymentMethod = document.getElementById("paymentMethod")?.value;

    if (
      !shipping.fullName ||
      !shipping.phone ||
      !shipping.address ||
      !shipping.city ||
      !shipping.state ||
      !shipping.pincode
    ) {
      throw new Error("Please fill all shipping details.");
    }

    if (!paymentMethod) {
      throw new Error("Please select a payment method.");
    }

    await api("/orders/place", {
      method: "POST",
      body: JSON.stringify({ shipping, paymentMethod })
    });

    if (msg) msg.textContent = "Order placed successfully.";

    setTimeout(() => {
      location.href = "profile.html";
    }, 1200);
  } catch (err) {
    if (msg) msg.textContent = err.message;
  }
}

/* =========================
   PROFILE
========================= */
async function loadProfile() {
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const ordersWrap = document.getElementById("ordersWrap");

  if (!ordersWrap) return;

  if (!getToken()) {
    ordersWrap.innerHTML = `<p class="muted">Please login to see your orders.</p>`;
    return;
  }

  try {
    const user = getUser();

    if (profileName) profileName.textContent = user?.name || "-";
    if (profileEmail) profileEmail.textContent = user?.email || "-";

    const orders = await api("/orders/my-orders");

    if (!orders || !orders.length) {
      ordersWrap.innerHTML = `<p class="muted">No orders yet.</p>`;
      return;
    }

    ordersWrap.innerHTML = orders
      .map(
        (order) => `
          <div class="order-item">
            <div style="flex:1">
              <h3>Order #${order._id.slice(-6).toUpperCase()}</h3>
              <p class="muted">Status: ${order.status || "Placed"}</p>
              <p class="muted">Payment: ${order.paymentMethod || "N/A"}</p>
              <p class="muted">Items: ${order.items?.length || 0}</p>
            </div>
            <div class="price">₹${order.totalAmount || 0}</div>
          </div>
        `
      )
      .join("");
  } catch (err) {
    ordersWrap.innerHTML = `<p class="muted">${err.message}</p>`;
  }
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  updateNav();
  loadProducts();
  loadCart();
  loadProfile();

  document.getElementById("signupForm")?.addEventListener("submit", handleSignup);
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document.getElementById("checkoutForm")?.addEventListener("submit", handleCheckout);
});
