import { db } from './firebase.js';
import { ref, set, get, child, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// 1. ตั้งค่า Global เพื่อให้ HTML เรียกใช้ได้ (แก้ปัญหา type="module")
// ==========================================
window.saveAllToFirebase = saveAllToFirebase;
window.previewImage = previewImage;
window.cancelImage = cancelImage;
window.finalSubmit = finalSubmit;
window.deleteRow = deleteRow; // เพิ่มฟังก์ชันลบแถว

// ==========================================
// 2. เริ่มทำงานเมื่อโหลดหน้าเว็บ
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    // ดึงค่าจาก URL
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    const id = params.get('id');

    // บันทึก Role ลง LocalStorage ถ้ามีค่ามาใหม่
    if (role) localStorage.setItem('role', role);
    if (id) localStorage.setItem('documentId', id);

    // ตรวจสอบสิทธิ์และปรับหน้าจอ
    checkUserRoleForUI();

    // โหลดข้อมูลถ้ามี ID
    if (localStorage.getItem('documentId')) {
        loadDataFromFirebase();
    }
}

// ==========================================
// 3. จัดการ UI ตาม Role (Admin vs User)
// ==========================================
function checkUserRoleForUI() {
    const role = localStorage.getItem('role');
    const isAdmin = role === 'admin';

    const adminControls = document.getElementById('admin-controls');
    const adminElements = document.querySelectorAll('.admin-only');
    const editStatus = document.querySelector('.edit-status');

    if (isAdmin) {
        // --- ADMIN MODE ---
        if (adminControls) adminControls.style.display = 'block';
        if (editStatus) editStatus.style.display = 'inline';
        adminElements.forEach(el => el.style.display = 'inline-block');
        
        enableAdminEditMode();
    } else {
        // --- USER MODE ---
        if (adminControls) adminControls.style.display = 'none';
        if (editStatus) editStatus.style.display = 'none';
        adminElements.forEach(el => el.style.display = 'none');
        
        disableAdminEditMode();
    }
}

function enableAdminEditMode() {
    // 1. เปิดให้แก้ไข Input ทั้งหมดที่เป็นของ Admin
    document.querySelectorAll('.admin-input').forEach(input => {
        input.disabled = false;
        if(input.type === 'text') input.style.backgroundColor = '#fff';
    });

    // 2. ทำให้ข้อความที่มี class 'can-edit' แก้ไขได้
    document.querySelectorAll('.can-edit').forEach(el => {
        el.contentEditable = true;
        el.style.backgroundColor = '#fffacd'; // สีเหลืองอ่อนให้รู้ว่าแก้ได้
        el.style.border = '1px dashed #ccc';
        el.style.cursor = 'text';
    });

    // 3. ทำให้ข้อมูลทรัพย์สินแก้ไขได้
    document.querySelectorAll('.container span').forEach(span => {
        span.contentEditable = true;
        span.style.backgroundColor = '#e8f4ff';
        span.style.border = '1px dashed #0066cc';
    });

    // 4. เพิ่มปุ่มจัดการแถว (ถ้ายังไม่มี)
    addRowManagement();
}

function disableAdminEditMode() {
    // ปิดการแก้ไขส่วนของ Admin
    document.querySelectorAll('.admin-input').forEach(input => input.disabled = true);
    
    // ปิด ContentEditable
    document.querySelectorAll('[contentEditable="true"]').forEach(el => {
        el.contentEditable = false;
        el.style.backgroundColor = 'transparent';
        el.style.border = 'none';
    });

    // แต่เปิดให้ User แก้ไขส่วนของ User ได้ (Checkbox การทดสอบ)
    document.querySelectorAll('.user-input').forEach(input => input.disabled = false);
}

// ==========================================
// 4. จัดการรูปภาพ (แปลงเป็น Base64)
// ==========================================
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewBox = document.getElementById(previewId);
            const img = previewBox.querySelector('img');
            const placeholder = previewBox.querySelector('.preview-placeholder');
            
            // หาปุ่มยกเลิก (จัดการทั้งแบบ userPreview และ admin preview)
            let cancelBtn;
            if (previewId === 'userPreview1') {
                cancelBtn = document.getElementById('userCancel1');
            } else {
                // สำหรับ Admin ID จะเป็น itFile -> itCancel
                const baseId = input.id.replace('File', ''); 
                cancelBtn = document.getElementById(baseId + 'Cancel');
            }

            img.src = e.target.result;
            img.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function cancelImage(inputId, previewId) {
    document.getElementById(inputId).value = ""; // ล้างค่า input file
    
    const previewBox = document.getElementById(previewId);
    const img = previewBox.querySelector('img');
    const placeholder = previewBox.querySelector('.preview-placeholder');
    
    // หาปุ่มยกเลิก
    let cancelBtn;
    if (previewId === 'userPreview1') {
        cancelBtn = document.getElementById('userCancel1');
    } else {
        const baseId = inputId.replace('File', '');
        cancelBtn = document.getElementById(baseId + 'Cancel');
    }

    img.src = "";
    img.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

// ==========================================
// 5. จัดการตาราง (เพิ่ม/ลบ แถว)
// ==========================================
function addRowManagement() {
    const table = document.querySelector('.main-table');
    
    // เพิ่มปุ่ม Add Row ถ้ายังไม่มี
    if (!document.getElementById('btn-add-row')) {
        const btn = document.createElement('button');
        btn.id = 'btn-add-row';
        btn.textContent = '+ เพิ่มรายการตรวจสอบ';
        btn.className = 'admin-only action-btn';
        btn.style.cssText = "margin: 10px 0; background-color: #28a745; color: white;";
        btn.onclick = addNewRow;
        table.parentNode.insertBefore(btn, table.nextSibling);
    }

    // เพิ่มปุ่มลบในแต่ละแถว
    updateRowButtons();
}

function updateRowButtons() {
    const rows = document.querySelectorAll('.main-table tbody tr');
    rows.forEach(row => {
        // ถ้ายังไม่มีเซลล์ปุ่มลบ ให้เพิ่มเข้าไป
        if (!row.querySelector('.del-cell')) {
            const td = document.createElement('td');
            td.className = 'del-cell admin-only';
            td.style.textAlign = 'center';
            td.innerHTML = `<button onclick="deleteRow(this)" style="background:red; color:white; border:none; border-radius:3px; cursor:pointer;">🗑️</button>`;
            row.appendChild(td);
        }
    });
}

function addNewRow() {
    const tbody = document.querySelector('.main-table tbody');
    const index = tbody.rows.length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="text-align: center;">${index}</td>
        <td class="can-edit" contenteditable="true" style="background:#fffacd; border:1px dashed #ccc;">รายการใหม่ (แก้ไขได้)</td>
        <td><input type="text" class="admin-input" style="width:100%"></td>
        <td class="del-cell admin-only" style="text-align:center;">
            <button onclick="deleteRow(this)" style="background:red; color:white; border:none; border-radius:3px; cursor:pointer;">🗑️</button>
        </td>
    `;
    tbody.appendChild(tr);
}

function deleteRow(btn) {
    if(confirm('ต้องการลบแถวนี้ใช่หรือไม่?')) {
        const row = btn.closest('tr');
        row.remove();
        // เรียงลำดับตัวเลขใหม่
        document.querySelectorAll('.main-table tbody tr').forEach((r, i) => {
            r.cells[0].innerText = i + 1;
        });
    }
}

// ==========================================
// 6. รวบรวมข้อมูลและบันทึก (Save)
// ==========================================
async function saveAllToFirebase() {
    try {
        const docId = localStorage.getItem('documentId') || 'doc_' + Date.now();
        
        // 1. เก็บข้อมูล Header (Asset Info)
        const assetSpans = document.querySelectorAll('.container span');
        const assetInfo = {
            line1: assetSpans[0] ? assetSpans[0].innerText : "",
            line2: assetSpans[1] ? assetSpans[1].innerText : ""
        };

        // 2. เก็บข้อมูลตาราง (Checklist)
        const checklist = [];
        document.querySelectorAll('.main-table tbody tr').forEach((row, index) => {
            // เก็บ Checkbox ในตาราง (ถ้ามี)
            const checkboxes = [];
            row.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                checkboxes.push({
                    label: cb.parentElement.innerText.trim(),
                    checked: cb.checked
                });
            });

            checklist.push({
                order: index + 1,
                // เอา Text จาก contentEditable หรือจาก cell ที่ 2
                topic: row.cells[1].innerText.trim(), 
                // ค่า input result
                result: row.querySelector('input[type="text"]')?.value || "",
                checkboxes: checkboxes
            });
        });

        // 3. เก็บข้อมูล User Test Section
        const userTest = {
            login: document.getElementById('test1')?.checked || false,
            program: document.getElementById('test2')?.checked || false,
            share: document.getElementById('test3')?.checked || false,
            other: document.getElementById('test4')?.checked || false,
            otherText: document.querySelector('label[for="test4"]')?.nextElementSibling?.value || ""
        };

        // 4. เก็บรูปลายเซ็น (Base64)
        const signatures = {
            user: {
                img: document.querySelector('#userPreview1 img')?.src || "",
                date: document.querySelector('.test-section input[type="date"]')?.value || ""
            },
            it: document.getElementById('itImage')?.src || "",
            mgr: document.getElementById('mgrImage')?.src || ""
        };

        // สร้าง Object ข้อมูลทั้งหมด
        const data = {
            assetInfo,
            checklist,
            userTest,
            signatures,
            lastUpdate: new Date().toISOString(),
            status: 'draft' // หรือ logic ตรวจสอบว่าครบไหม
        };

        // บันทึกลง Firebase
        console.log("Saving...", data);
        await set(ref(db, 'checklists/' + docId), data);
        
        localStorage.setItem('documentId', docId);
        alert('บันทึกข้อมูลเรียบร้อยแล้ว!');

        // ตรวจสอบลายเซ็นเพื่อโชว์ปุ่ม Submit
        checkFinalSubmit(data);

    } catch (e) {
        console.error(e);
        alert('เกิดข้อผิดพลาด: ' + e.message);
    }
}

// ==========================================
// 7. โหลดข้อมูล (Load)
// ==========================================
async function loadDataFromFirebase() {
    const docId = localStorage.getItem('documentId');
    if (!docId) return;

    try {
        const snapshot = await get(child(ref(db), 'checklists/' + docId));
        if (snapshot.exists()) {
            const data = snapshot.val();
            renderData(data);
        }
    } catch (e) {
        console.error("Load Error:", e);
    }
}

function renderData(data) {
    // 1. Asset Info
    const assetSpans = document.querySelectorAll('.container span');
    if (data.assetInfo) {
        if(assetSpans[0]) assetSpans[0].innerText = data.assetInfo.line1;
        if(assetSpans[1]) assetSpans[1].innerText = data.assetInfo.line2;
    }

    // 2. Checklist Table (สร้างตารางใหม่ตามข้อมูล)
    if (data.checklist) {
        const tbody = document.querySelector('.main-table tbody');
        tbody.innerHTML = ""; // ล้างของเก่า

        data.checklist.forEach(item => {
            const tr = document.createElement('tr');
            
            // สร้าง HTML ของ checkbox ในตาราง (ถ้ามีข้อมูลเก่า)
            let cbHtml = "";
            if (item.checkboxes && item.checkboxes.length > 0) {
                cbHtml = `<div class="checkbox-container">`;
                item.checkboxes.forEach(cb => {
                    cbHtml += `<label class="check-item"><input type="checkbox" class="admin-input" ${cb.checked ? 'checked' : ''}> ${cb.label}</label> `;
                });
                cbHtml += `</div>`;
            }

            tr.innerHTML = `
                <td style="text-align: center;">${item.order}</td>
                <td class="can-edit">${item.topic} ${cbHtml}</td>
                <td><input type="text" class="admin-input" value="${item.result || ''}"></td>
            `;
            tbody.appendChild(tr);
        });

        // ถ้าเป็น Admin ให้เปิดโหมดแก้ไขสำหรับแถวที่เพิ่งโหลดมา
        if (localStorage.getItem('role') === 'admin') enableAdminEditMode();
    }

    // 3. User Test
    if (data.userTest) {
        if(document.getElementById('test1')) document.getElementById('test1').checked = data.userTest.login;
        if(document.getElementById('test2')) document.getElementById('test2').checked = data.userTest.program;
        if(document.getElementById('test3')) document.getElementById('test3').checked = data.userTest.share;
        if(document.getElementById('test4')) document.getElementById('test4').checked = data.userTest.other;
        
        // ช่อง Other Text
        const otherInput = document.querySelector('label[for="test4"]')?.nextElementSibling;
        if(otherInput && data.userTest.otherText) otherInput.value = data.userTest.otherText;
    }

    // 4. Signatures
    if (data.signatures) {
        // User
        if (data.signatures.user?.img && data.signatures.user.img.includes('data:image')) {
            const img = document.querySelector('#userPreview1 img');
            img.src = data.signatures.user.img;
            img.style.display = 'block';
            document.querySelector('#userPreview1 .preview-placeholder').style.display = 'none';
        }
        document.querySelector('.test-section input[type="date"]').value = data.signatures.user?.date || "";

        // IT
        if (data.signatures.it && data.signatures.it.includes('data:image')) {
            const img = document.getElementById('itImage');
            img.src = data.signatures.it;
            img.style.display = 'block';
            document.getElementById('itPreview .preview-placeholder')?.setAttribute('style', 'display:none');
             document.getElementById('itPreview').querySelector('.preview-placeholder').style.display = 'none';
        }

        // Manager
        if (data.signatures.mgr && data.signatures.mgr.includes('data:image')) {
            const img = document.getElementById('mgrImage');
            img.src = data.signatures.mgr;
            img.style.display = 'block';
            document.getElementById('mgrPreview').querySelector('.preview-placeholder').style.display = 'none';
        }
    }
}

// ==========================================
// 8. Final Submit (เมื่อลายเซ็นครบ)
// ==========================================
function checkFinalSubmit(data) {
    if (localStorage.getItem('role') !== 'admin') return;

    // ตรวจสอบอย่างง่ายว่ามีลายเซ็นครบไหม
    const hasUser = data.signatures.user.img.length > 100;
    const hasIT = data.signatures.it.length > 100;
    
    if (hasUser && hasIT) {
        const finalWrap = document.getElementById('final-submit-wrap');
        const finalBtn = document.getElementById('final-submit');
        if(finalWrap) finalWrap.style.display = 'block';
        if(finalBtn) finalBtn.style.display = 'block';
    }
}

function finalSubmit() {
    if(confirm("ยืนยันการส่งเอกสาร? \n(เมื่อส่งแล้วจะไม่สามารถแก้ไขได้)")) {
        const docId = localStorage.getItem('documentId');
        update(ref(db, 'checklists/' + docId), {
            status: 'completed',
            submittedAt: new Date().toISOString()
        }).then(() => {
            alert('ส่งเอกสารเรียบร้อย!');
            window.location.href = 'index.html'; // กลับหน้าหลัก
        });
    }
}