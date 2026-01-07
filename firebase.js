import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ใช้ Config เดิมของคุณ

const firebaseConfig = {
  apiKey: "AIzaSyAP1_sgUK02v289wWgIRmNHxnOburGICAE",
  authDomain: "form-sts001.firebaseapp.com",
  databaseURL: "https://form-sts001-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "form-sts001",
  storageBucket: "form-sts001.firebasestorage.app",
  messagingSenderId: "917455094092",
  appId: "1:917455094092:web:178779efce9016e7574fe9",
  measurementId: "G-5EL2CH6GY5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
/// บันทึก role หลังล็อกอิน
localStorage.setItem('role', 'admin'); // หรือ 'user'

// โหลด role ทุกหน้า
const role = localStorage.getItem('role') || 'user';
const isAdmin = role === 'admin';

// ฟังก์ชันทำงานเมื่อกดปุ่ม Login
const btnLogin = document.getElementById('btnLogin');
if (btnLogin) {
    btnLogin.onclick = async () => {
        const username = document.getElementById('username').value;
        const passcode = document.getElementById('passcode').value;
        const errorMsg = document.getElementById('error-msg');

        const dbRef = ref(db);
        try {
            const snapshot = await get(child(dbRef, `users/${username}`));
            if (snapshot.exists()) {
                const userData = snapshot.val();
                
                // ในหน้า login.html ตอนเช็ครหัส
if (String(userData.pass) === String(passcode)) { // แปลงทั้งคู่เป็น String ก่อนเช็ค
    try {
        localStorage.setItem('role', userData.role);
        localStorage.setItem('name', userData.name);
    } catch (e) { /* ignore */ }
    // ถ้ามี id ใน URL ของหน้า login ให้ส่งต่อ id กลับไปด้วย
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const base = `index.html?role=${userData.role}&name=${encodeURIComponent(userData.name)}`;
    window.location.href = id ? `${base}&id=${encodeURIComponent(id)}` : base;
} else {
                    errorMsg.style.display = 'block';
                    alert("รหัสผ่านไม่ถูกต้อง");
                }
            } else {
                errorMsg.style.display = 'block';
                alert("ไม่พบชื่อผู้ใช้งานนี้");
            }
        } catch (error) {
            console.error(error);
            alert("การเชื่อมต่อฐานข้อมูลผิดพลาด");
        }
        
    };
}