// ตัวอย่างโค้ดการตั้งค่า Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// กำหนด config ของ Firebase project คุณ
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
// อย่าเซ็ต role โดยอัตโนมัติที่ไฟล์ preview — ให้ใช้จาก login หรือพารามิเตอร์ URL
const role = localStorage.getItem('role') || null;
const isAdmin = role === 'admin';

// เริ่มต้น Firebase App
const app = initializeApp(firebaseConfig);
// เรียก Database ผ่าน app ที่สร้างขึ้น
const db = getDatabase(app);
let allRecords = [];

// ดึงข้อมูลทั้งหมดจาก Firebase มาโชว์
onValue(ref(db, 'checklists'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
        allRecords = Object.values(data); // แปลงเป็น Array เพื่อให้ค้นหาง่าย
    } else {
        allRecords = []; // กรณีไม่มีข้อมูล
    }
    renderTable(allRecords);
});


console.log('preview.js loaded');

// ดึงข้อมูลทั้งหมดจาก Firebase มาโชว์
onValue(ref(db, 'checklists'), (snapshot) => {
    const data = snapshot.val();
    allRecords = data ? Object.values(data) : [];
    renderTable(allRecords);
});

function renderTable(data) {
    const html = data.map(item => `
        <tr>
            <td>${item.timestamp || '-'}</td>
            <td>${item.assetId || '-'}</td>
            <td>${item.userName || 'ยังไม่มีผู้รับ'}</td>
            <td>${item.status || '-'}</td>
            <td><button class="view-btn" data-id="${item.assetId}">ดู</button></td>
        </tr>
    `).join('');
    document.getElementById('table-body').innerHTML = html;
}

// ฟังก์ชันค้นหาชื่อผู้ใช้หรือ ID
window.filterData = function() {
    const term = document.getElementById('search-input').value.toLowerCase();

    const filtered = allRecords.filter(item => 
        (item.userName && item.userName.toLowerCase().includes(term)) || 
        (item.assetId && item.assetId.toLowerCase().includes(term))
    );
    renderTable(filtered);
};

// Event Delegation สำหรับปุ่มดูรายละเอียด
document.getElementById('table-body').addEventListener('click', (event) => {
    if (event.target && event.target.matches('button.view-btn')) {
        const assetId = event.target.dataset.id;
        viewDetail(assetId);
    }
});

// ฟังก์ชันดูรายละเอียด
function viewDetail(assetId) {
    alert(`คุณคลิกดูรายละเอียดของ Asset ID: ${assetId}`);
    // หรือจะ redirect ไปหน้าอื่น เช่น:
    // window.location.href = `detail.html?id=${assetId}`;
}

// ผูก event หลัง DOM โหลด
document.addEventListener('DOMContentLoaded', () => {
    // ปุ่มย้อนกลับ — ถ้ากดกลับไปหน้า index ให้ส่งต่อพารามิเตอร์ role/id ใน URL
    const params = new URLSearchParams(window.location.search);
    const curRole = params.get('role');
    const curId = params.get('id');

    document.querySelectorAll('[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => {
            let target = btn.dataset.goto || 'index.html';

            try {
                // ถ้าเป็น path relative เช่น 'index.html' ให้เพิ่มพารามิเตอร์ถ้ามี
                const isIndexTarget = /(^|\/)index\.html$/.test(target) || target === '' || target === '/';

                if (isIndexTarget && (curRole || curId)) {
                    const url = new URL(target, location.origin + location.pathname);
                    if (curRole) url.searchParams.set('role', curRole);
                    if (curId) url.searchParams.set('id', curId);
                    target = url.pathname + url.search;
                }
            } catch (e) {
                // ในกรณี parse ผิดพลาด ให้ fallback ไปปกติ
                console.error('build target url error', e);
            }

            window.location.href = target;
        });
    });

    // ปุ่มพิมพ์รายงาน
    const printBtn = document.getElementById('btnPrint');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }

    // แสดงวันที่ปัจจุบันด้านล่าง
    const dateSpan = document.getElementById('current-date');
    if (dateSpan) {
        dateSpan.textContent = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
});
