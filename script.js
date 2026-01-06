// นำเข้าเฉพาะฟังก์ชันที่จำเป็นจาก Firebase (ตรวจสอบ path ให้ตรงกับที่ใช้ใน login)
import { getDatabase, ref, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let isEditEnabled = false;
const assetId = "NB25-PRO0015"; // หรือดึงจาก URL ก็ได้

async function checkRole() {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || 'user';
    const userName = params.get('name'); // ดึงชื่อที่ส่งมาจากหน้า Login
    const isAdmin = role === 'admin';
    
    const adminPanel = document.getElementById('admin-controls');
    const adminInputs = document.querySelectorAll('.admin-input');
    const userInputs = document.querySelectorAll('.user-input');
    const editableTexts = document.querySelectorAll('.can-edit');

    // เติมชื่อผู้ใช้งานในช่องลงชื่ออัตโนมัติ (ถ้ามีค่าส่งมา)
    const sigInput = document.querySelector('.signature-line');
    if (sigInput && userName) {
        sigInput.value = decodeURIComponent(userName);
    }

    if (isAdmin) {
    // --- โหมด ADMIN (IT) ---
    document.body.classList.add('admin-mode');
    if (adminPanel) adminPanel.style.display = 'block';
    
    // Admin แก้ไขส่วนตรวจเช็ค IT ได้ แต่ห้ามแก้ส่วนที่ User ต้องติ๊กเอง
    adminInputs.forEach(el => el.disabled = false); 
    userInputs.forEach(el => el.disabled = true); 
    
} else {
    // --- โหมด USER (ผู้รับมอบ) ---
    document.body.classList.remove('admin-mode');
    if (adminPanel) adminPanel.style.display = 'none';

    // User ห้ามแก้ส่วนที่ IT ตรวจมาแล้ว แต่ต้องทำส่วนการทดสอบเอง
    adminInputs.forEach(el => el.disabled = true); 
    userInputs.forEach(el => el.disabled = false); 
}
        // ดึงข้อมูลที่ Admin เคยบันทึกไว้ใน Firebase มาแสดงผลให้ User เห็น
        const db = getDatabase();
        const snapshot = await get(ref(db, `checklists/${assetId}/adminData`));
        if (snapshot.exists()) {
            const adminData = snapshot.val();
            adminInputs.forEach((el, index) => {
                const val = adminData[`item_${index}`];
                if (el.type === 'checkbox') el.checked = val;
                else el.value = val || "";
            });
        }

        adminInputs.forEach(el => el.disabled = true);
        userInputs.forEach(el => el.disabled = false);
        editableTexts.forEach(el => el.contentEditable = "false");
    }


// ฟังก์ชันบันทึกข้อมูลลง Firebase
window.saveData = function() {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    const db = getDatabase();
    const updates = {};

    if (role === 'admin') {
        const adminData = {};
        document.querySelectorAll('.admin-input').forEach((el, index) => {
            adminData[`item_${index}`] = el.type === 'checkbox' ? el.checked : el.value;
        });
        updates[`checklists/${assetId}/adminData`] = adminData;
    } else {
        const userData = {
            signature: document.querySelector('.signature-line')?.value || "",
            date: new Date().toLocaleDateString('th-TH'),
            status: "Completed"
        };
        updates[`checklists/${assetId}/userData`] = userData;
    }

    update(ref(db), updates)
        .then(() => alert("บันทึกข้อมูลลงระบบเรียบร้อย!"))
        .catch(err => alert("เกิดข้อผิดพลาด: " + err.message));
}

// ฟังก์ชันสร้างลิงก์ (เพิ่มชื่อ Admin ไปด้วยเพื่อให้ User รู้ว่าใครส่งมา)
window.generateUserLink = function() {
    const params = new URLSearchParams(window.location.search);
    const adminName = params.get('name') || "";
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?role=user&id=${assetId}&from=${encodeURIComponent(adminName)}`;
    
    prompt("คัดลอกลิงก์นี้ส่งให้ User:", shareUrl);
}

window.toggleEditMode = function() {
    isEditEnabled = !isEditEnabled;
    const editableTexts = document.querySelectorAll('.can-edit');
    const btn = document.getElementById('edit-mode-btn');

    editableTexts.forEach(el => {
        el.contentEditable = isEditEnabled;
        el.style.backgroundColor = isEditEnabled ? "#fff9c4" : "transparent";
        el.style.border = isEditEnabled ? "1px dashed orange" : "none";
    });

    btn.innerHTML = isEditEnabled ? 'ปิดโหมดแก้ไข' : 'เปิดโหมดแก้ไขข้อความ';
}

window.onload = checkRole;