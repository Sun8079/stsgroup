let isEditEnabled = false; // สถานะโหมดแก้ไขข้อความ

function checkRole() {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || 'user';
    const isAdmin = role === 'admin';
    
    const adminPanel = document.getElementById('admin-controls');
    const adminInputs = document.querySelectorAll('.admin-input');
    const userInputs = document.querySelectorAll('.user-input');
    const editableTexts = document.querySelectorAll('.can-edit');

    if (isAdmin) {
        // --- โหมด ADMIN ---
        document.body.classList.add('admin-mode');
        if (adminPanel) adminPanel.style.display = 'block';

        // Admin จัดการส่วนของตนเองได้ (ติ๊ก IT / ดูไฟล์)
        adminInputs.forEach(el => el.disabled = false);

        // ล็อกส่วน User (Admin ดูได้อย่างเดียว ห้ามแก้เช็คลิสต์ที่ User ต้องทำ)
        userInputs.forEach(el => {
            el.disabled = true;
            el.classList.add('locked-view');
        });

        // หัวข้อข้อความ: เริ่มต้นให้ล็อกไว้ก่อน (จนกว่าจะกดปุ่ม Edit)
        editableTexts.forEach(el => el.contentEditable = "false");

    } else {
        // --- โหมด USER ---
        document.body.classList.remove('admin-mode');
        if (adminPanel) adminPanel.style.display = 'none';

        // 1. รับค่าที่ Admin ติ๊กส่งมาใน URL (ถ้ามี)
        if (params.has('it1')) document.getElementById('it-check1').checked = (params.get('it1') === 'true');
        if (params.has('it2')) document.getElementById('it-check2').checked = (params.get('it2') === 'true');

        // 2. ล็อกส่วนของ Admin (User แก้ของ IT ไม่ได้)
        adminInputs.forEach(el => el.disabled = true);

        // 3. ปลดล็อกส่วนของ User (ให้ User ติ๊กและลงชื่อได้)
        userInputs.forEach(el => {
            el.disabled = false;
            el.classList.remove('locked-view');
        });

        // 4. ล็อกหัวข้อข้อความถาวรสำหรับ User
        editableTexts.forEach(el => el.contentEditable = "false");
    }
}

// ฟังก์ชันสำหรับ Admin: กดเพื่อเริ่ม/หยุด การแก้ไขหัวข้อข้อความ
function toggleEditMode() {
    isEditEnabled = !isEditEnabled;
    const editableTexts = document.querySelectorAll('.can-edit');
    const btn = document.getElementById('edit-mode-btn');

    editableTexts.forEach(el => {
        el.contentEditable = isEditEnabled;
        // ไฮไลท์สีเพื่อให้ Admin รู้ว่าช่องไหนแก้ได้บ้าง
        el.style.backgroundColor = isEditEnabled ? "#fff9c4" : "transparent";
        el.style.border = isEditEnabled ? "1px dashed orange" : "none";
    });

    btn.innerHTML = isEditEnabled ? 
        '<span class="material-symbols-outlined">save</span> ปิดโหมดแก้ไข' : 
        '<span class="material-symbols-outlined">edit</span> เปิดโหมดแก้ไขข้อความ';
}

// ฟังก์ชันสำหรับ Admin: สร้างลิงก์ส่งต่อให้ User
function generateUserLink() {
    const itCheck1 = document.getElementById('it-check1').checked;
    const itCheck2 = document.getElementById('it-check2').checked;
    
    const baseUrl = window.location.origin + window.location.pathname;
    // พ่วงสถานะ it1, it2 และเปลี่ยน role เป็น user
    const shareUrl = `${baseUrl}?role=user&it1=${itCheck1}&it2=${itCheck2}`;
    
    prompt("ก๊อปปี้ลิงก์นี้ส่งให้ User ทาง Line/Email:", shareUrl);
}

// เรียกใช้งานเมื่อโหลดหน้าเว็บ
window.onload = checkRole;