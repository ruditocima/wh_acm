import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyChPNI9RPXneZfjg0YyNCTlVDfSiEVdrKs",
  authDomain: "wms-acm.firebaseapp.com",
  projectId: "wms-acm",
  storageBucket: "wms-acm.firebasestorage.app",
  messagingSenderId: "427966771954",
  appId: "1:427966771954:web:e1cbec9d2dfc4684a4166b",
  databaseURL: "https://wms-acm-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const fbDb = getDatabase(app);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  const loginSection = document.getElementById('login-section');
  const appSection = document.getElementById('app-section');
  const userEmailText = document.getElementById('user-email-text');

  if (!loginSection || !appSection) return;

  if (user) {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    if (userEmailText) {
      const userName = user.displayName || user.email.split('@')[0];
      userEmailText.innerText = userName;
    }
    if (typeof window.loadFromFirebase === 'function') {
      window.loadFromFirebase();
    }
  } else {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
});

window.handleLogin = function(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');
  
  if (!emailInput || !passwordInput || !errorEl) return;

  const email = emailInput.value;
  const password = passwordInput.value;
  errorEl.classList.add('hidden');

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      const loginForm = document.getElementById('login-form');
      if (loginForm) loginForm.reset();
    })
    .catch((error) => {
      errorEl.innerText = "Login gagal: Email atau Password salah!";
      errorEl.classList.remove('hidden');
    });
};

window.handleLogout = function() {
  signOut(auth);
};

window.syncToFirebase = function() {
  if (!fbDb || !window.db) return;
  const dbRef = ref(fbDb, 'data_aplikasi');
  set(dbRef, window.db).then(() => {
    console.log("Data berhasil tersimpan di Firebase!");
  }).catch((error) => {
    console.error("Gagal simpan ke Firebase:", error);
  });
};

window.loadFromFirebase = function() {
  if (!fbDb) return;
  get(child(ref(fbDb), 'data_aplikasi')).then((snapshot) => {
    if (snapshot.exists()) {
      window.db = snapshot.val();
      localStorage.setItem('wms_app_data', JSON.stringify(window.db));
    } else {
      console.log("Belum ada data di Firebase, menggunakan data awal.");
    }
    if (typeof renderDashboard === 'function') {
      renderDashboard();
    }
  }).catch((err) => {
    console.error("Gagal memuat dari Firebase:", err);
    if (typeof renderDashboard === 'function') renderDashboard();
  });
};