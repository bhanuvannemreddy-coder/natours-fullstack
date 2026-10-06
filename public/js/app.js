const API = "/api/v1";

const app = document.getElementById("app");
const nav = document.getElementById("nav");
const toast = document.getElementById("toast");

const state = {
  user: null,
  tours: [],
};

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[c],
  );

const token = () => localStorage.getItem("natours_token");

function notify(msg, type = "ok") {
  toast.textContent = msg;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2800);
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token()) {
    headers.Authorization = `Bearer ${token()}`;
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

function saveAuth(data) {
  if (data?.token) {
    localStorage.setItem("natours_token", data.token);
  }

  state.user = data?.data?.user || null;
}

function logout() {
  localStorage.removeItem("natours_token");

  state.user = null;

  updateNav();

  location.hash = "#home";

  home();

  notify("Logged out");
}

// ============================================================
// NAVIGATION
// ============================================================

function updateNav() {
  nav.innerHTML = state.user
    ? `
      <a class="navlink" href="#home">Tours</a>

      <a class="navlink" href="#profile">
        ${esc(state.user.name)}
      </a>

      ${
        state.user.role === "admin"
          ? `<a class="navlink" href="#manage">Manage</a>`
          : ""
      }

      <button class="navbtn" id="logoutBtn">
        Logout
      </button>
    `
    : `
      <a class="navlink" href="#home">Home</a>

      <a class="navlink" href="#login">Login</a>

      <a class="navbtn pill" href="#signup">
        Sign up
      </a>
    `;

  document.getElementById("logoutBtn")?.addEventListener("click", logout);
}

// ============================================================
// AUTH HYDRATE
// ============================================================

async function hydrate() {
  if (!token()) {
    state.user = null;
    return updateNav();
  }

  try {
    const d = await api("/users/me");

    state.user = d.data.user;
  } catch {
    localStorage.removeItem("natours_token");

    state.user = null;
  }

  updateNav();
}

// ============================================================
// TOUR IMAGE
// ============================================================

function imgFor(t) {
  let m = (t.imageCover || "").match(/tour-(\d+)/);

  let n = m ? m[1] : "2";

  return `/img/tours/tour${n}.png`;
}

// ============================================================
// TOUR CARD
// ============================================================

function card(t) {
  return `
    <article class="card">

      <img
        src="${imgFor(t)}"
        alt="${esc(t.name)}"
      >

      <div class="card-body">

        <div class="eyebrow">
          ${esc(t.difficulty || "Adventure")}
        </div>

        <h3>
          ${esc(t.name)}
        </h3>

        <p class="muted">
          ${esc(t.summary || "An unforgettable nature adventure.")}
        </p>

        <div class="meta">

          <span>
            ★ ${Number(t.ratingsAverage || 0).toFixed(1)}
          </span>

          <span>•</span>

          <span>
            ${esc(t.duration)} days
          </span>

          <span>•</span>

          <span>
            ${esc(t.maxGroupSize)} people
          </span>

        </div>

        <div class="actions">

          <span class="price">
            $${esc(t.price)}
          </span>

          <a
            class="btn btn-secondary"
            href="#tour/${t._id}"
          >
            View tour
          </a>

        </div>

      </div>

    </article>
  `;
}

// ============================================================
// HOME
// ============================================================

async function home() {
  if (!state.user) {
    app.innerHTML = `
      <section class="hero">

        <div>

          <div class="eyebrow">
            Nature · Adventure · Discovery
          </div>

          <h1>
            Exciting tours for
            <span>adventurous people.</span>
          </h1>

          <p>
            Discover hand-picked journeys through
            mountains, forests and wild landscapes.
            Your Natours backend is now connected
            to a simple, responsive frontend.
          </p>

          <div class="actions">

            <a
              class="btn btn-primary"
              href="#signup"
            >
              Start exploring
            </a>

            <a
              class="btn btn-secondary"
              href="#login"
            >
              I already have an account
            </a>

          </div>

        </div>

        <div class="hero-art"></div>

      </section>

      <section class="section">

        <div class="center">

          <h2>
            Your adventure starts here.
          </h2>

          <p class="muted">
            Sign in to load the tours from your
            protected API and experience JWT
            authentication in action.
          </p>

        </div>

      </section>
    `;

    return;
  }

  app.innerHTML = `
    <div class="loading">
      Loading tours…
    </div>
  `;

  try {
    const d = await api("/tours?limit=50");

    state.tours = d.data.tours;

    app.innerHTML = `
      <section class="section">

        <div class="section-head">

          <div>

            <div class="eyebrow">
              Discover
            </div>

            <h2>
              Popular adventures
            </h2>

            <p class="muted">
              ${d.results} tours from your
              MongoDB database.
            </p>

          </div>

          <a
            class="btn btn-secondary"
            href="#profile"
          >
            My profile
          </a>

        </div>

        <div class="grid">
          ${state.tours.map(card).join("")}
        </div>

      </section>
    `;
  } catch (e) {
    app.innerHTML = `
      <section class="section">

        <div class="empty">

          ${esc(e.message)}

          <br>
          <br>

          <button
            class="btn btn-primary"
            onclick="location.reload()"
          >
            Try again
          </button>

        </div>

      </section>
    `;
  }
}

// ============================================================
// LOGIN / SIGNUP
// ============================================================

function authPage(type) {
  const login = type === "login";

  app.innerHTML = `
    <section class="section">

      <div class="form-card">

        <div class="eyebrow">
          Natours account
        </div>

        <h1>
          ${login ? "Welcome back" : "Create your account"}
        </h1>

        <form id="authForm">

          ${
            !login
              ? `
                <div class="field">

                  <label>Name</label>

                  <input
                    name="name"
                    required
                  >

                </div>
              `
              : ""
          }

          <div class="field">

            <label>Email</label>

            <input
              type="email"
              name="email"
              required
            >

          </div>

          <div class="field">

            <label>Password</label>

            <input
              type="password"
              name="password"
              minlength="8"
              required
            >

          </div>

          ${
            !login
              ? `
                <div class="field">

                  <label>
                    Confirm password
                  </label>

                  <input
                    type="password"
                    name="passwordConfirm"
                    minlength="8"
                    required
                  >

                </div>
              `
              : ""
          }

          <button
            class="btn btn-primary"
            type="submit"
          >
            ${login ? "Login" : "Sign up"}
          </button>

        </form>

        <div class="actions">

          <a
            class="muted"
            href="#${login ? "signup" : "login"}"
          >
            ${
              login
                ? "Need an account? Sign up"
                : "Already have an account? Login"
            }
          </a>

          ${
            login
              ? `
                <a
                  class="muted"
                  href="#forgot"
                >
                  Forgot password?
                </a>
              `
              : ""
          }

        </div>

      </div>

    </section>
  `;

  document.getElementById("authForm").onsubmit = async (e) => {
    e.preventDefault();

    const body = Object.fromEntries(new FormData(e.target));

    try {
      const d = await api(`/users/${login ? "login" : "signup"}`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      saveAuth(d);

      updateNav();

      notify(login ? "Logged in successfully" : "Account created");

      location.hash = "#home";
    } catch (err) {
      notify(err.message, "error");
    }
  };
}

// ============================================================
// FORGOT PASSWORD
// ============================================================

function forgot() {
  app.innerHTML = `
    <section class="section">

      <div class="form-card">

        <div class="eyebrow">
          Security
        </div>

        <h1>
          Reset your password
        </h1>

        <p class="muted">
          Enter your email. Your backend will
          generate a reset token and send the
          reset URL through your configured
          mail service.
        </p>

        <form id="forgot">

          <div class="field">

            <label>Email</label>

            <input
              type="email"
              name="email"
              required
            >

          </div>

          <button class="btn btn-primary">
            Send reset email
          </button>

        </form>

      </div>

    </section>
  `;

  document.getElementById("forgot").onsubmit = async (e) => {
    e.preventDefault();

    try {
      await api("/users/forgotPassword", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });

      notify("Reset email sent");
    } catch (err) {
      notify(err.message, "error");
    }
  };
}

// ============================================================
// RESET PASSWORD
// ============================================================

function reset(tokenValue) {
  app.innerHTML = `
    <section class="section">

      <div class="form-card">

        <div class="eyebrow">
          New password
        </div>

        <h1>
          Set a new password
        </h1>

        <form id="reset">

          <div class="field">

            <label>
              New password
            </label>

            <input
              type="password"
              name="password"
              minlength="8"
              required
            >

          </div>

          <div class="field">

            <label>
              Confirm password
            </label>

            <input
              type="password"
              name="passwordConfirm"
              minlength="8"
              required
            >

          </div>

          <button class="btn btn-primary">
            Reset password
          </button>

        </form>

      </div>

    </section>
  `;

  document.getElementById("reset").onsubmit = async (e) => {
    e.preventDefault();

    try {
      const d = await api(`/users/resetPassword/${tokenValue}`, {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });

      saveAuth(d);

      updateNav();

      notify("Password reset successful");

      location.hash = "#home";
    } catch (err) {
      notify(err.message, "error");
    }
  };
}

// ============================================================
// TOUR DETAIL
// ============================================================

async function tour(id) {
  app.innerHTML = `
    <div class="loading">
      Loading tour…
    </div>
  `;

  try {
    const d = await api(`/tours/${id}`);

    const t = d.data.tour;

    app.innerHTML = `
      <section class="detail">

        <div class="detail-hero">

          <img
            src="${imgFor(t)}"
            alt="${esc(t.name)}"
          >

          <div>

            <div class="eyebrow">
              ${esc(t.difficulty)}
              ·
              ${esc(t.duration)} days
            </div>

            <h1>
              ${esc(t.name)}
            </h1>

            <p class="muted">
              ${esc(t.summary)}
            </p>

            <div class="facts">

              <div class="fact">
                <b>Price</b>
                $${esc(t.price)}
              </div>

              <div class="fact">
                <b>Group size</b>
                ${esc(t.maxGroupSize)}
              </div>

              <div class="fact">
                <b>Rating</b>
                ★
                ${Number(t.ratingsAverage || 0).toFixed(1)}
                (${esc(t.ratingsQuantity || 0)})
              </div>

              <div class="fact">
                <b>Starts</b>
                ${t.startDates?.length || 0}
                dates
              </div>

            </div>

            <div class="actions">

              <a
                class="btn btn-primary"
                href="#home"
              >
                Back to tours
              </a>

              ${
                state.user?.role === "admin"
                  ? `
                    <button
                      class="btn btn-danger"
                      id="deleteTour"
                    >
                      Delete tour
                    </button>
                  `
                  : ""
              }

            </div>

          </div>

        </div>

        <div class="section">

          <h2>
            About this tour
          </h2>

          <p
            class="muted"
            style="white-space:pre-line;line-height:1.8"
          >
            ${esc(t.description)}
          </p>

        </div>

      </section>
    `;

    document
      .getElementById("deleteTour")
      ?.addEventListener("click", async () => {
        if (!confirm("Delete this tour?")) {
          return;
        }

        try {
          await api(`/tours/${id}`, {
            method: "DELETE",
          });

          notify("Tour deleted");

          location.hash = "#home";
        } catch (e) {
          notify(e.message, "error");
        }
      });
  } catch (e) {
    app.innerHTML = `
      <section class="section">

        <div class="empty">
          ${esc(e.message)}
        </div>

      </section>
    `;
  }
}

// ============================================================
// PROFILE
// ============================================================

async function profile() {
  if (!state.user) {
    location.hash = "#login";
    return;
  }

  app.innerHTML = `
    <section class="profile">

      <div class="eyebrow">
        Account
      </div>

      <h1>
        Your profile
      </h1>

      <p class="muted">
        Role:
        <strong>
          ${esc(state.user.role)}
        </strong>
      </p>

      <div class="profile-grid">

        <div
          class="form-card"
          style="margin:0"
        >

          <h2>
            Update profile
          </h2>

          <form id="profileForm">

            <div class="field">

              <label>Name</label>

              <input
                name="name"
                value="${esc(state.user.name)}"
                required
              >

            </div>

            <div class="field">

              <label>Email</label>

              <input
                name="email"
                type="email"
                value="${esc(state.user.email)}"
                required
              >

            </div>

            <button class="btn btn-primary">
              Save profile
            </button>

          </form>

        </div>


        <div
          class="form-card"
          style="margin:0"
        >

          <h2>
            Change password
          </h2>

          <form id="passForm">

            <div class="field">

              <label>
                Current password
              </label>

              <input
                type="password"
                name="passwordCurrent"
                required
              >

            </div>

            <div class="field">

              <label>
                New password
              </label>

              <input
                type="password"
                name="password"
                minlength="8"
                required
              >

            </div>

            <div class="field">

              <label>
                Confirm password
              </label>

              <input
                type="password"
                name="passwordConfirm"
                minlength="8"
                required
              >

            </div>

            <button class="btn btn-primary">
              Change password
            </button>

          </form>

        </div>

      </div>

      <div class="admin">

        <h2>
          Danger zone
        </h2>

        <p class="muted">
          Deactivating your account prevents
          future login and hides the user from
          normal queries.
        </p>

        <button
          class="btn btn-danger"
          id="deleteMe"
        >
          Deactivate my account
        </button>

      </div>

    </section>
  `;

  // UPDATE MY PROFILE

  document.getElementById("profileForm").onsubmit = async (e) => {
    e.preventDefault();

    try {
      const d = await api("/users/updateMe", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });

      state.user = d.data.user;

      updateNav();

      notify("Profile updated");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // UPDATE MY PASSWORD

  document.getElementById("passForm").onsubmit = async (e) => {
    e.preventDefault();

    try {
      const d = await api("/users/updateMyPassword", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });

      saveAuth(d);

      updateNav();

      notify("Password changed");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // DELETE MY ACCOUNT

  document.getElementById("deleteMe").onclick = async () => {
    if (!confirm("Deactivate your account?")) {
      return;
    }

    try {
      await api("/users/deleteMe", {
        method: "DELETE",
      });

      logout();
    } catch (err) {
      notify(err.message, "error");
    }
  };
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

async function manage() {
  // ADMIN ONLY

  if (state.user?.role !== "admin") {
    notify("Admin access required", "error");

    location.hash = "#home";

    return;
  }

  app.innerHTML = `
    <section class="section">

      <div class="section-head">

        <div>

          <div class="eyebrow">
            Administration
          </div>

          <h2>
            Admin Dashboard
          </h2>

          <p class="muted">
            Manage tours, users and tour analytics.
          </p>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- TOUR STATISTICS -->
      <!-- ================================================= -->

      <div class="admin">

        <div class="section-head">

          <div>

            <div class="eyebrow">
              Analytics
            </div>

            <h2>
              Tour Statistics
            </h2>

          </div>

        </div>

        <div id="tourStats">

          <div class="loading">
            Loading statistics...
          </div>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- CREATE TOUR -->
      <!-- ================================================= -->

      <div class="admin">

        <div class="section-head">

          <div>

            <div class="eyebrow">
              Tours
            </div>

            <h2>
              Create New Tour
            </h2>

          </div>

        </div>

        <div
          class="form-card"
          style="margin:0 auto"
        >

          <form id="createTour">

            <div class="field">

              <label>
                Name
              </label>

              <input
                name="name"
                required
                minlength="10"
                maxlength="40"
              >

            </div>


            <div class="profile-grid">

              <div class="field">

                <label>
                  Duration (days)
                </label>

                <input
                  type="number"
                  name="duration"
                  required
                  min="1"
                >

              </div>


              <div class="field">

                <label>
                  Max group size
                </label>

                <input
                  type="number"
                  name="maxGroupSize"
                  required
                  min="1"
                >

              </div>

            </div>


            <div class="profile-grid">

              <div class="field">

                <label>
                  Difficulty
                </label>

                <select name="difficulty">

                  <option value="easy">
                    Easy
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="difficult">
                    Difficult
                  </option>

                </select>

              </div>


              <div class="field">

                <label>
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                >

              </div>

            </div>


            <div class="field">

              <label>
                Cover image filename
              </label>

              <input
                name="imageCover"
                value="tour-1-cover.jpg"
                required
              >

            </div>


            <div class="field">

              <label>
                Summary
              </label>

              <textarea
                name="summary"
                rows="3"
              ></textarea>

            </div>


            <div class="field">

              <label>
                Description
              </label>

              <textarea
                name="description"
                rows="6"
                required
              ></textarea>

            </div>


            <button
              class="btn btn-primary"
              type="submit"
            >
              Create Tour
            </button>

          </form>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- MANAGE TOURS -->
      <!-- ================================================= -->

      <div class="admin">

        <div class="section-head">

          <div>

            <div class="eyebrow">
              Tours
            </div>

            <h2>
              Manage Tours
            </h2>

          </div>

        </div>

        <div id="adminTours">

          <div class="loading">
            Loading tours...
          </div>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- MANAGE USERS -->
      <!-- ================================================= -->

      <div class="admin">

        <div class="section-head">

          <div>

            <div class="eyebrow">
              Users
            </div>

            <h2>
              Manage Users
            </h2>

            <p class="muted">
              Create, update and delete users.
            </p>

          </div>

        </div>


        <!-- CREATE USER -->

        <div
          class="form-card"
          style="margin:0 auto 2rem"
        >

          <h3>
            Create New User
          </h3>

          <form id="createUser">

            <div class="profile-grid">

              <div class="field">

                <label>
                  Name
                </label>

                <input
                  name="name"
                  required
                  placeholder="User name"
                >

              </div>


              <div class="field">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="user@example.com"
                >

              </div>

            </div>


            <div class="profile-grid">

              <div class="field">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  minlength="8"
                  required
                >

              </div>


              <div class="field">

                <label>
                  Confirm Password
                </label>

                <input
                  type="password"
                  name="passwordConfirm"
                  minlength="8"
                  required
                >

              </div>

            </div>


            <div class="field">

              <label>
                Role
              </label>

              <select name="role">

                <option value="user">
                  User
                </option>

                <option value="lead-guide">
                  Lead Guide
                </option>

                <option value="admin">
                  Admin
                </option>

              </select>

            </div>


            <button
              class="btn btn-primary"
              type="submit"
            >
              Create User
            </button>

          </form>

        </div>


        <!-- USERS LIST -->

        <div id="adminUsers">

          <div class="loading">
            Loading users...
          </div>

        </div>

      </div>

    </section>
  `;

  // ==========================================================
  // CREATE TOUR
  // ==========================================================

  document.getElementById("createTour").onsubmit = async (e) => {
    e.preventDefault();

    const body = Object.fromEntries(new FormData(e.target));

    body.duration = Number(body.duration);
    body.maxGroupSize = Number(body.maxGroupSize);
    body.price = Number(body.price);

    try {
      await api("/tours", {
        method: "POST",
        body: JSON.stringify(body),
      });

      notify("Tour created successfully");

      e.target.reset();

      loadAdminTours();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // ==========================================================
  // CREATE USER
  // ==========================================================

  document.getElementById("createUser").onsubmit = async (e) => {
    e.preventDefault();

    const body = Object.fromEntries(new FormData(e.target));

    if (body.password !== body.passwordConfirm) {
      notify("Passwords do not match", "error");

      return;
    }

    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify(body),
      });

      notify("User created successfully");

      e.target.reset();

      loadUsers();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Load all admin data

  await Promise.all([loadAdminTours(), loadUsers(), loadStats()]);
}

// ============================================================
// ADMIN — LOAD TOURS
// ============================================================

async function loadAdminTours() {
  const container = document.getElementById("adminTours");

  try {
    const d = await api("/tours?limit=50");

    const tours = d.data.tours || [];

    if (!tours.length) {
      container.innerHTML = `
        <div class="empty">
          No tours found.
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="grid">

        ${tours
          .map(
            (t) => `
              <article class="card">

                <img
                  src="${imgFor(t)}"
                  alt="${esc(t.name)}"
                >

                <div class="card-body">

                  <div class="eyebrow">
                    ${esc(t.difficulty || "Adventure")}
                  </div>

                  <h3>
                    ${esc(t.name)}
                  </h3>

                  <p class="muted">
                    ${esc(t.summary || "No summary available.")}
                  </p>

                  <div class="meta">

                    <span>
                      ${esc(t.duration)}
                      days
                    </span>

                    <span>•</span>

                    <span>
                      $${esc(t.price)}
                    </span>

                  </div>

                  <div class="actions">

                    <button
                      class="btn btn-secondary edit-tour"
                      data-id="${t._id}"
                    >
                      Edit
                    </button>

                    <button
                      class="btn btn-danger delete-tour"
                      data-id="${t._id}"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </article>
            `,
          )
          .join("")}

      </div>
    `;

    // DELETE TOUR

    container.querySelectorAll(".delete-tour").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.id;

        if (!confirm("Delete this tour?")) {
          return;
        }

        try {
          await api(`/tours/${id}`, {
            method: "DELETE",
          });

          notify("Tour deleted");

          loadAdminTours();
        } catch (err) {
          notify(err.message, "error");
        }
      });
    });

    // EDIT TOUR

    container.querySelectorAll(".edit-tour").forEach((button) => {
      button.addEventListener("click", async () => {
        await editTour(button.dataset.id);
      });
    });
  } catch (err) {
    container.innerHTML = `
      <div class="empty">
        ${esc(err.message)}
      </div>
    `;
  }
}

// ============================================================
// ADMIN — EDIT TOUR
// ============================================================

async function editTour(id) {
  try {
    const d = await api(`/tours/${id}`);

    const t = d.data.tour;

    app.innerHTML = `
      <section class="section">

        <div class="section-head">

          <div>

            <div class="eyebrow">
              Administration
            </div>

            <h2>
              Update Tour
            </h2>

            <p class="muted">
              Editing ${esc(t.name)}
            </p>

          </div>

        </div>


        <div class="form-card">

          <form id="editTour">

            <div class="field">

              <label>
                Name
              </label>

              <input
                name="name"
                value="${esc(t.name)}"
                required
                minlength="10"
                maxlength="40"
              >

            </div>


            <div class="profile-grid">

              <div class="field">

                <label>
                  Duration
                </label>

                <input
                  type="number"
                  name="duration"
                  value="${esc(t.duration)}"
                  required
                >

              </div>


              <div class="field">

                <label>
                  Max group size
                </label>

                <input
                  type="number"
                  name="maxGroupSize"
                  value="${esc(t.maxGroupSize)}"
                  required
                >

              </div>

            </div>


            <div class="profile-grid">

              <div class="field">

                <label>
                  Difficulty
                </label>

                <select name="difficulty">

                  <option
                    value="easy"
                    ${t.difficulty === "easy" ? "selected" : ""}
                  >
                    Easy
                  </option>

                  <option
                    value="medium"
                    ${t.difficulty === "medium" ? "selected" : ""}
                  >
                    Medium
                  </option>

                  <option
                    value="difficult"
                    ${t.difficulty === "difficult" ? "selected" : ""}
                  >
                    Difficult
                  </option>

                </select>

              </div>


              <div class="field">

                <label>
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  value="${esc(t.price)}"
                  required
                >

              </div>

            </div>


            <div class="field">

              <label>
                Cover image
              </label>

              <input
                name="imageCover"
                value="${esc(t.imageCover || "")}"
              >

            </div>


            <div class="field">

              <label>
                Summary
              </label>

              <textarea
                name="summary"
                rows="3"
              >${esc(t.summary || "")}</textarea>

            </div>


            <div class="field">

              <label>
                Description
              </label>

              <textarea
                name="description"
                rows="7"
                required
              >${esc(t.description || "")}</textarea>

            </div>


            <div class="actions">

              <button
                class="btn btn-primary"
                type="submit"
              >
                Save Changes
              </button>

              <button
                class="btn btn-secondary"
                type="button"
                id="cancelEdit"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      </section>
    `;

    document.getElementById("cancelEdit").onclick = () => {
      location.hash = "#manage";
    };

    document.getElementById("editTour").onsubmit = async (e) => {
      e.preventDefault();

      const body = Object.fromEntries(new FormData(e.target));

      body.duration = Number(body.duration);

      body.maxGroupSize = Number(body.maxGroupSize);

      body.price = Number(body.price);

      try {
        await api(`/tours/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });

        notify("Tour updated successfully");

        location.hash = "#manage";
      } catch (err) {
        notify(err.message, "error");
      }
    };
  } catch (err) {
    notify(err.message, "error");
  }
}

// ============================================================
// ADMIN — TOUR STATISTICS
// ============================================================

async function loadStats() {
  const container = document.getElementById("tourStats");

  try {
    const d = await api("/tours/tour-stats");

    const stats = d.data.stats || [];

    if (!stats.length) {
      container.innerHTML = `
        <div class="empty">
          No statistics available.
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="grid">

        ${stats
          .map(
            (s) => `
              <div class="fact">

                <b>
                  ${esc(s._id || "Tour")}
                </b>

                <div class="meta">

                  <span>
                    ⭐
                    ${Number(s.avgRating || 0).toFixed(1)}
                  </span>

                  <span>
                    •
                  </span>

                  <span>
                    ${esc(s.numRatings || 0)}
                    ratings
                  </span>

                </div>

                <p class="muted">
                  Average price:
                  $${esc(Number(s.avgPrice || 0).toFixed(0))}
                </p>

              </div>
            `,
          )
          .join("")}

      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="empty">
        ${esc(err.message)}
      </div>
    `;
  }
}

// ============================================================
// ADMIN — LOAD USERS
// ============================================================

async function loadUsers() {
  const container = document.getElementById("adminUsers");

  try {
    const d = await api("/users");

    // Backend returns:
    // data: { users: [...] }

    const users = d.data.users || [];

    if (!users.length) {
      container.innerHTML = `
        <div class="empty">
          No users found.
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="grid">

        ${users
          .map(
            (user) => `
              <article class="card">

                <div class="card-body">

                  <div class="eyebrow">
                    ${esc(user.role || "user")}
                  </div>

                  <h3>
                    ${esc(user.name)}
                  </h3>

                  <p class="muted">
                    ${esc(user.email)}
                  </p>

                  <div class="actions">

                    <button
                      class="btn btn-secondary edit-user"
                      data-id="${user._id}"
                    >
                      Edit
                    </button>

                    <button
                      class="btn btn-danger delete-user"
                      data-id="${user._id}"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </article>
            `,
          )
          .join("")}

      </div>
    `;

    // ========================================================
    // DELETE USER
    // ========================================================

    container.querySelectorAll(".delete-user").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.id;

        if (!confirm("Delete this user?")) {
          return;
        }

        try {
          await api(`/users/${id}`, {
            method: "DELETE",
          });

          notify("User deleted successfully");

          loadUsers();
        } catch (err) {
          notify(err.message, "error");
        }
      });
    });

    // ========================================================
    // EDIT USER
    // ========================================================

    container.querySelectorAll(".edit-user").forEach((button) => {
      button.addEventListener("click", () => {
        editUser(button.dataset.id);
      });
    });
  } catch (err) {
    container.innerHTML = `
      <div class="empty">
        ${esc(err.message)}
      </div>
    `;
  }
}

// ============================================================
// ADMIN — EDIT USER
// ============================================================

async function editUser(id) {
  try {
    const d = await api(`/users/${id}`);

    const user = d.data.user;

    const name = prompt("Enter new name:", user.name);

    if (name === null) {
      return;
    }

    const email = prompt("Enter new email:", user.email);

    if (email === null) {
      return;
    }

    const role = prompt("Enter role (user / lead-guide / admin):", user.role);

    if (role === null) {
      return;
    }

    const validRoles = ["user", "lead-guide", "admin"];

    if (!validRoles.includes(role)) {
      notify("Invalid role. Use user, lead-guide, or admin.", "error");

      return;
    }

    await api(`/users/${id}`, {
      method: "PATCH",

      body: JSON.stringify({
        name,
        email,
        role,
      }),
    });

    notify("User updated successfully");

    loadUsers();
  } catch (err) {
    notify(err.message, "error");
  }
}

// ============================================================
// ROUTER
// ============================================================

function route() {
  updateNav();

  const h = location.hash.slice(1);

  if (h.startsWith("tour/")) {
    return tour(h.split("/")[1]);
  }

  if (h === "login") {
    return authPage("login");
  }

  if (h === "signup") {
    return authPage("signup");
  }

  if (h === "forgot") {
    return forgot();
  }

  if (h.startsWith("reset/")) {
    return reset(h.split("/")[1]);
  }

  if (h === "profile") {
    return profile();
  }

  if (h === "manage") {
    return manage();
  }

  return home();
}

// ============================================================
// START
// ============================================================

window.addEventListener("hashchange", route);

hydrate().then(route);

window.addEventListener("load", () => {
  if (!location.hash) {
    location.hash = "#home";
  }
});
