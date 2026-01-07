// Preview listing: show user name, admin checkbox summary, status and completion date
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
let allRecords = []; // array of { id, data }

onValue(ref(db, 'checklists'), (snapshot) => {
    const raw = snapshot.val() || {};
    allRecords = Object.keys(raw).map(k => ({ id: k, data: raw[k] }));
    renderTable(allRecords);
});

function summarizeAdminValues(adminValues) {
    if (!adminValues) return '-';
    const parts = [];
    Object.keys(adminValues).forEach(i => {
        const row = adminValues[i];
        if (!row) return;
        const checked = Object.entries(row.checkboxes || {}).filter(([k,v]) => v).map(([k]) => k.trim());
        if (checked.length) {
            parts.push(checked.join(', '));
        }
    });
    return parts.length ? parts.join(' | ') : '-';
}

function renderTable(records) {
    if (!records || records.length === 0) {
        document.getElementById('table-body').innerHTML = '<tr><td colspan="4" style="text-align:center;">ไม่มีข้อมูล</td></tr>';
        return;
    }

    const html = records.map((r, idx) => {
        const d = r.data;
        const userName = d.userData?.name || 'ยังไม่มีผู้รับ';
        const adminSummary = summarizeAdminValues(d.adminValues);
        const status = d.adminData?.status || d.userData?.status || '-';
        const finished = d.adminData?.submittedAt || d.userData?.updatedAt || '-';

        return `
        <tr>
            <td style="text-align:center">${idx+1}</td>
            <td><strong>${userName}</strong><br><small>ID: ${r.id}</small></td>
            <td>${adminSummary}</td>
            <td>
                <div>${status}</div>
                <div style="font-size:0.9em; color:#666">${finished}</div>
                <div style="margin-top:6px"><a href="index.html?role=admin&id=${r.id}">เปิด</a></div>
            </td>
        </tr>`;
    }).join('');

    document.getElementById('table-body').innerHTML = html;
}

// search
document.getElementById('search-input').addEventListener('input', () => {
    const term = document.getElementById('search-input').value.trim().toLowerCase();
    if (!term) return renderTable(allRecords);
    const filtered = allRecords.filter(r => (r.data.userData?.name || '').toLowerCase().includes(term) || (r.id || '').toLowerCase().includes(term));
    renderTable(filtered);
});

// view detail (redirect)
function viewDetail(assetId) {
    window.location.href = `index.html?role=admin&id=${assetId}`;
}

// print button
document.getElementById('btnPrint').addEventListener('click', () => window.print());

// show current date
const dateSpan = document.getElementById('current-date');
if (dateSpan) dateSpan.textContent = new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' });

