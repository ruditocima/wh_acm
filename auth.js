import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";[cite: 1]
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";[cite: 1]
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";[cite: 1]

const firebaseConfig = {
  apiKey: "AIzaSyBVdHM-81Q6Az_uRKzfDwIHebALbOtU4Rk",[cite: 1]
  authDomain: "wms-acm.firebaseapp.com",[cite: 1]
  projectId: "wms-acm",[cite: 1]
  storageBucket: "wms-acm.firebasestorage.app",[cite: 1]
  messagingSenderId: "427966771954",[cite: 1]
  appId: "1:427966771954:web:e1cbec9d2dfc4684a4166b",[cite: 1]
  databaseURL: "https://wms-acm-default-rtdb.asia-southeast1.firebasedatabase.app"[cite: 1]
};

const app = initializeApp(firebaseConfig);[cite: 1]
const fbDb = getDatabase(app);[cite: 1]
const auth = getAuth(app);[cite: 1]

onAuthStateChanged(auth, (user) => {[cite: 1]
  const loginSection = document.getElementById('login-section');[cite: 1]
  const appSection = document.getElementById('app-section');[cite: 1]
  const userEmailText = document.getElementById('user-email-text');[cite: 1]

  if (!loginSection || !appSection) return;[cite: 1]

  if (user) {[cite: 1]
    loginSection.classList.add('hidden');[cite: 1]
    appSection.classList.remove('hidden');[cite: 1]
    if (userEmailText) {[cite: 1]
      const userName = user.displayName || user.email.split('@')[0];[cite: 1]
      userEmailText.innerText = userName;[cite: 1]
    }
    if (typeof window.loadFromFirebase === 'function') {[cite: 1]
      window.loadFromFirebase();[cite: 1]
    }
  } else {
    loginSection.classList.remove('hidden');[cite: 1]
    appSection.classList.add('hidden');[cite: 1]
  }
});

window.handleLogin = function(e) {[cite: 1]
  e.preventDefault();[cite: 1]
  const emailInput = document.getElementById('login-email');[cite: 1]
  const passwordInput = document.getElementById('login-password');[cite: 1]
  const errorEl = document.getElementById('login-error');[cite: 1]
  
  if (!emailInput || !passwordInput || !errorEl) return;[cite: 1]

  const email = emailInput.value;[cite: 1]
  const password = passwordInput.value;[cite: 1]
  errorEl.classList.add('hidden');[cite: 1]

  signInWithEmailAndPassword(auth, email, password)[cite: 1]
    .then(() => {
      const loginForm = document.getElementById('login-form');[cite: 1]
      if (loginForm) loginForm.reset();[cite: 1]
    })
    .catch((error) => {
      errorEl.innerText = "Login gagal: Email atau Password salah!";[cite: 1]
      errorEl.classList.remove('hidden');[cite: 1]
    });
};

window.handleLogout = function() {[cite: 1]
  signOut(auth);[cite: 1]
};

window.syncToFirebase = function() {[cite: 1]
  if (!fbDb || !window.db) return;[cite: 1]
  const dbRef = ref(fbDb, 'data_aplikasi');[cite: 1]
  set(dbRef, window.db).then(() => {[cite: 1]
    console.log("Data berhasil tersimpan di Firebase!");[cite: 1]
  }).catch((error) => {
    console.error("Gagal simpan ke Firebase:", error);[cite: 1]
  });
};

window.loadFromFirebase = function() {[cite: 1]
  if (!fbDb) return;[cite: 1]
  get(child(ref(fbDb), 'data_aplikasi')).then((snapshot) => {[cite: 1]
    if (snapshot.exists()) {[cite: 1]
      window.db = snapshot.val();[cite: 1]
      localStorage.setItem('wms_app_data', JSON.stringify(window.db));[cite: 1]
    } else {
      console.log("Belum ada data di Firebase, menggunakan data awal.");[cite: 1]
    }
    if (typeof renderDashboard === 'function') {[cite: 1]
      renderDashboard();[cite: 1]
    }
  }).catch((err) => {
    console.error("Gagal memuat dari Firebase:", err);[cite: 1]
    if (typeof renderDashboard === 'function') renderDashboard();[cite: 1]
  });
};
