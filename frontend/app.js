const API_BASE = "http://localhost:5050/api";

function getToken() {
  return localStorage.getItem("cycleflex_token") || "";
}

function getUser() {
  const raw = localStorage.getItem("cycleflex_user");
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem("cycleflex_token", token);
  localStorage.setItem("cycleflex_user", JSON.stringify(user));
}

function logout() {
  localStorage.removeItem("cycleflex_token");
  localStorage.removeItem("cycleflex_user");
  location.href = "login.html";
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken() ? `Bearer ${getToken()}` : ""
    },
    ...options
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function updateNav() {
  const navUser = document.getElementById("navUser");
  const navAuth = document.getElementById("navAuth");
  const user = getUser();

  if (navUser) navUser.textContent = user ? `Hi, ${user.name}` : "Guest";
  if (navAuth) {
    navAuth.innerHTML = user
      ? `<button class="btn btn-outline" onclick="logout()">Logout</button>`
      : `<a href="login.html" class="btn btn-outline">Login</a>`;
  }
}

async function loadProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  try {
    const products = await api("/products");
    grid.innerHTML = products
      .map(
        (p) => `
        <div class="card">
          <img src="${p.image}" alt="${p.title}" />
          <div class="card-body">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <div class="price">₹${p.price}</div>
            <div class="row">
              <select class="select" id="size-${p._id}">
                ${(p.sizes || ["S", "M", "L", "XL"]).map((s) => `<option value="${s}">${s}</option>`).join("")}
              </select>
              <button class="btn" onclick="addToCart('${p._id}')">Add to Cart</button>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<p>${err.message}</p>`;
  }
}

async function addToCart(productId) {
  try {
    if (!getToken()) {
      alert("Please login first.");
      location.href = "login.html";
      return;
    }

    const size = document.getElementById(`size-${productId}`)?.value || "M";
    await api("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, size, quantity: 1 })
    });
    alert("Added to cart");
  } catch (err) {
    alert(err.message);
  }
}

async function loadCart() {
  const cartWrap = document.getElementById("cartWrap");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartWrap) return;

  try {
    const items = await api("/cart");

    if (!items.length) {
      cartWrap.innerHTML = `<p class="muted">Your cart is empty.</p>`;
      if (cartTotal) cartTotal.textContent = "₹0";
      return;
    }

    let total = 0;
    cartWrap.innerHTML = items
      .map((item) => {
        total += item.price * item.quantity;
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

    if (cartTotal) cartTotal.textContent = `₹${total}`;
  } catch (err) {
    cartWrap.innerHTML = `<p>${err.message}</p>`;
  }
}

async function removeFromCart(productId, size) {
  try {
    await api("/cart/remove", {
      method: "POST",
      body: JSON.stringify({ productId, size })
    });
    loadCart();
  } catch (err) {
    alert(err.message);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const msg = document.getElementById("signupMsg");

  try {
    const data = await api("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    setSession(data.token, data.user);
    location.href = "products.html";
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const msg = document.getElementById("loginMsg");

  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setSession(data.token, data.user);
    location.href = "products.html";
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function handleCheckout(e) {
  e.preventDefault();
  const shipping = {
    fullName: document.getElementById("fullName").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
    city: document.getElementById("city").value,
    state: document.getElementById("state").value,
    pincode: document.getElementById("pincode").value
  };
  const paymentMethod = document.getElementById("paymentMethod").value;
  const msg = document.getElementById("checkoutMsg");

  try {
    await api("/orders/place", {
      method: "POST",
      body: JSON.stringify({ shipping, paymentMethod })
    });
    msg.textContent = "Order placed successfully.";
    setTimeout(() => {
      location.href = "profile.html";
    }, 1000);
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function loadProfile() {
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const ordersWrap = document.getElementById("ordersWrap");
  if (!ordersWrap) return;

  try {
    const user = getUser();
    if (profileName) profileName.textContent = user?.name || "-";
    if (profileEmail) profileEmail.textContent = user?.email || "-";

    const orders = await api("/orders/my-orders");
    if (!orders.length) {
      ordersWrap.innerHTML = `<p class="muted">No orders yet.</p>`;
      return;
    }

    ordersWrap.innerHTML = orders
      .map(
        (order) => `
          <div class="order-item">
            <div style="flex:1">
              <h3>Order #${order._id.slice(-6).toUpperCase()}</h3>
              <p class="muted">Status: ${order.status}</p>
              <p class="muted">Payment: ${order.paymentMethod}</p>
              <p class="muted">Items: ${order.items.length}</p>
            </div>
            <div class="price">₹${order.totalAmount}</div>
          </div>
        `
      )
      .join("");
  } catch (err) {
    ordersWrap.innerHTML = `<p>${err.message}</p>`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  updateNav();
  loadProducts();
  loadCart();
  loadProfile();

  document.getElementById("signupForm")?.addEventListener("submit", handleSignup);
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document.getElementById("checkoutForm")?.addEventListener("submit", handleCheckout);
});