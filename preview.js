// preview.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAP1_sgUK02v289wwGiRmNHxnObuRGICAE",
    authDomain: "form-sts001.firebaseapp.com",
    projectId: "form-sts001",
    databaseURL: "https://form-sts001-default-rtdb.asia-southeast1.firebasedatabase.app",
    appId: "1:917455094092:web:178779efce9016e7574fe9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let allChecklists = [];

// ดึงข้อมูลจาก Firebase แบบ Real-time
function loadData() {
    const dbRef = ref(db, 'checklists');
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            allChecklists = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            renderTable(allChecklists);
        } else {
            document.getElementById('table-body').innerHTML = '<tr><td colspan="4" style="text-align:center;">ไม่พบข้อมูลในระบบ</td></tr>';
        }
    });
}

// ฟังก์ชันสร้างแถวตาราง
function renderTable(dataList) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    dataList.forEach((item, index) => {
        const uData = item.userData || {};
        const isComplete = uData.signature && uData.signature !== "";
        
        const row = `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>
                    <strong>${uData.signature || 'ยังไม่มีผู้ลงชื่อ'}</strong><br>
                    <small style="color: #64748b;">ID: ${item.id}</small>
                </td>
                <td>
                    <div class="mini-checklist">
                        <label class="check-item"><input type="checkbox" ${uData.login ? 'checked' : ''} disabled> Login เครื่องได้</label>
                        <label class="check-item"><input type="checkbox" ${uData.software ? 'checked' : ''} disabled> ใช้งานโปรแกรมพื้นฐาน</label>
                        <label class="check-item"><input type="checkbox" ${uData.sharing ? 'checked' : ''} disabled> เข้าถึง File Sharing</label>
                    </div>
                </td>
                <td style="text-align: center;">
                    <span class="status ${isComplete ? 'status-complete' : 'status-pending'}">
                        ${isComplete ? 'เสร็จสมบูรณ์' : 'กำลังดำเนินการ'}
                    </span><br>
                    <small style="display:block; margin-top:5px; color:#94a3b8;">${uData.date || 'รอดำเนินการ'}</small>
                </td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}

// ระบบค้นหา
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allChecklists.filter(item => {
        const name = (item.userData?.signature || "").toLowerCase();
        const assetId = (item.id || "").toLowerCase();
        return name.includes(term) || assetId.includes(term);
    });
    renderTable(filtered);
});

// การทำงานของปุ่มควบคุม
document.getElementById('btnBack').onclick = () => window.location.href = 'index.html';
document.getElementById('btnPrint').onclick = () => window.print();

// เริ่มโหลดข้อมูล
window.onload = () => {
    loadData();
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('th-TH');
};