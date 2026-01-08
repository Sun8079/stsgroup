
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, update, get, push } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
// editing state flags
let adminEditing = false;
let userEditing = false;

function toggleEditMode() {
    isEditEnabled = !isEditEnabled;

    document.querySelectorAll('.can-edit').forEach(el => {
        el.contentEditable = isEditEnabled;
        el.style.backgroundColor = isEditEnabled ? '#fff9c4' : 'transparent';
        el.style.border = isEditEnabled ? '1px dashed orange' : 'none';
    });

    // const btn = document.getElementById('edit-mode-btn');
    // if (btn) {
    //     btn.textContent = isEditEnabled
    //         ? 'ปิดโหมดแก้ไข'
    //         : 'เปิดโหมดแก้ไขข้อความ';
    // }
    // // เมื่อปิดโหมดแก้ไข ให้ล้าง style ที่อาจทำให้ layout ตารางพัง
    // if (!isEditEnabled) {
    //     document.querySelectorAll('.can-edit').forEach(el => {
    //         // ล้างเฉพาะ property ที่เราเปลี่ยนแปลงขณะ edit
    //         el.style.display = '';
    //         el.style.backgroundColor = '';
    //         el.style.border = '';
    //     });
    //     // ถ้าตารางถูกซ่อนด้วย inline-style ให้คืนค่าเป็นปกติ
    //     document.querySelectorAll('table').forEach(t => {
    //         if (t.style && (t.style.display === 'none' || t.style.display === '')) {
    //             t.style.display = '';
    //         }
    //     });
    // }
}
// ดูว่า URL เป็น admin หรือ user → แล้วเปิด/ปิด element บนหน้าเว็บให้ถูกสิทธิ์
async function checkRole() {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || 'user';
    const isAdmin = role === 'admin';

    // ดึง element ที่ต้องจัดการ
    const adminPanel = document.getElementById('admin-controls');
    const adminInputs = document.querySelectorAll('.admin-input');
    const userInputs = document.querySelectorAll('.user-input');
    const adminButtons = document.querySelectorAll('.admin-only');
    
    
       if (isAdmin) {
        // Admin
        adminPanel && (adminPanel.style.display = 'block');
        adminInputs.forEach(el => el.disabled = false);
        adminInputs.forEach(el => el.style.display = 'inline-block');
        userInputs.forEach(el => el.disabled = true);
        // el.disabled = false;
        //     el.style.display = 'inline-block';
       
        userInputs.forEach(el => el.disabled = true);

        // แสดงปุ่ม admin
        adminButtons.forEach(el => el.style.display = 'inline-block');
    } else {
        // User
        adminPanel && (adminPanel.style.display = 'none');
        adminInputs.forEach(el => el.disabled = true); // ปิดไม่ให้กด
        adminInputs.forEach(el => el.style.display = 'none'); // ซ่อนปุ่มเลือกไฟล์
        userInputs.forEach(el => el.disabled = false);
        adminPanel && (adminPanel.style.display = 'none');
        adminInputs.forEach(el => {
            el.disabled = true; 
            el.style.display = 'none';
        });
        userInputs.forEach(el => el.disabled = false);

        // ซ่อนปุ่ม admin
        adminButtons.forEach(el => el.style.display = 'none');
    }
}

// 1️⃣ ตรวจสอบ role (admin / user) และตั้งค่าหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
  checkRole();
    // หากมี assetId ให้โหลดข้อมูลจาก Firebase (adminSnapshot หรือ user/admin data)
    if (assetId) loadChecklist(assetId);
  // 2️⃣ ปุ่มเปิด-ปิดโหมดแก้ไขข้อความ (เฉพาะ Admin)
//   const editBtn = document.getElementById('edit-mode-btn');
//   if (editBtn) {
//     editBtn.addEventListener('click', toggleEditMode);
//   }

  // 3️⃣ เลือกรูปเซ็นชื่อ IT → แสดง Preview
  const itFile = document.getElementById('itFile');
  if (itFile) {
    itFile.addEventListener('change', (e) => {
      previewImage(e.target, 'itPreview');
    });
  }

  // 4️⃣ เลือกรูปเซ็นชื่อ Manager → แสดง Preview
  const mgrFile = document.getElementById('mgrFile');
  if (mgrFile) {
    mgrFile.addEventListener('change', (e) => {
      previewImage(e.target, 'mgrPreview');
    });
  }

  // 5️⃣ ปุ่มหรือ div ที่ใช้ data-goto สำหรับเปลี่ยนหน้า
  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = el.dataset.goto;
    });
  });

    // ปุ่มแก้ไขข้อมูล (shared) - เช็ค role ก่อนทำงาน
    const editDataBtn = document.getElementById('edit-data-btn');
    if (editDataBtn) {
        editDataBtn.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            const role = params.get('role') || localStorage.getItem('role') || 'user';
            // ถ้าเป็น Admin ให้สลับการแก้ admin-input
            if (role === 'admin') {
                adminEditing = !adminEditing;
                document.querySelectorAll('.admin-input').forEach(el => {
                    // allow file inputs and buttons to remain available
                    if (el.type === 'file') {
                        el.disabled = !adminEditing;
                        el.style.display = adminEditing ? 'inline-block' : (el.dataset.hiddenWhenNotAdmin ? 'none' : el.style.display);
                    } else {
                        el.disabled = !adminEditing;
                    }
                });
                editDataBtn.textContent = adminEditing ? 'ปิดแก้ไข (Admin)' : 'แก้ไขข้อมูล';
                if (!adminEditing && assetId) {
                    // ถ้ปิด mode แก้ไข ให้ถามว่าต้องการส่งลิงก์ให้ user แก้หรือไม่
                    const send = confirm('ต้องการส่งลิงก์ให้ผู้รับมอบ (User) แก้ข้อมูลไหม? เลือก "ตกลง" เพื่อสร้างลิงก์สำหรับผู้ใช้');
                    if (send) {
                        const userUrl = `${window.location.origin}/index.html?id=${encodeURIComponent(assetId)}`;
                        showLinkAlert('ส่งลิงก์ให้ User', 'ส่งลิงก์นี้ให้ User (ผู้รับต้องล็อกอินก่อนทำแบบฟอร์ม)', userUrl);
                    }
                }
            } else {
                // User toggles editability of user inputs
                userEditing = !userEditing;
                document.querySelectorAll('.user-input').forEach(el => el.disabled = !userEditing);
                editDataBtn.textContent = userEditing ? 'ปิดแก้ไขข้อมูล' : 'แก้ไขข้อมูล';
            }
        });
    }

  // Update submit button visibility based on preview images
  updateShowSubmitButton();

  // search by name (admin)
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) searchBtn.addEventListener('click', () => searchChecklistByName(document.getElementById('search-name').value));

});

// โหลดข้อมูล checklist จาก Firebase และแสดง snapshot สำหรับ user
async function loadChecklist(id) {
    try {
        const snapshot = await get(ref(db, `checklists/${id}`));
        if (!snapshot.exists()) return;
        const data = snapshot.val();

        const params = new URLSearchParams(window.location.search);
        const role = params.get('role') || localStorage.getItem('role') || 'user';

        // ถ้ามี adminValues ให้เติมค่าในตาราง (ทั้ง admin และ user จะเห็นค่าที่ admin ทำไว้)
        if (data.adminValues) {
            const rows = document.querySelectorAll('.main-table tbody tr');
            rows.forEach((tr, i) => {
                const v = data.adminValues[i];
                if (!v) return;

                // เติมค่าใน field ผลการตรวจสอบ (admin-input)
                const resultInput = tr.querySelector('input[type="text"].admin-input') || tr.querySelector('textarea.admin-input');
                if (role === 'admin') {
                    if (resultInput) resultInput.value = v.result || '';
                } else {
                    // user view: แทนที่ input ด้วยข้อความอ่านอย่างเดียว
                    if (resultInput) {
                        const span = document.createElement('div');
                        span.className = 'readonly-admin-value';
                        span.textContent = v.result || '';
                        resultInput.parentNode.replaceChild(span, resultInput);
                    }
                }

                // แสดงสถานะ checkbox ของ admin ใน column เดียวกัน (convert to text)
                tr.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    const lblText = cb.parentNode ? (cb.parentNode.textContent || '').trim() : '';
                    const checked = !!(v.checkboxes && (v.checkboxes[lblText] || v.checkboxes[`cb_${i}`]));
                    if (role === 'admin') {
                        cb.checked = checked;
                    } else {
                        // replace checkbox with tick/no-tick text
                        const span = document.createElement('span');
                        span.textContent = checked ? '✓' : '';
                        cb.parentNode.replaceChild(span, cb);
                    }
                });
            });
        } else if (data.adminSnapshot && role !== 'admin') {
            // fallback: ถ้ามีเฉพาะ snapshot HTML ให้แสดง snapshot
            const container = document.createElement('div');
            container.className = 'admin-snapshot';
            container.innerHTML = data.adminSnapshot;
            const mainTable = document.querySelector('.main-table');
            if (mainTable && mainTable.parentNode) mainTable.parentNode.replaceChild(container, mainTable);
        }

        // เติมข้อมูลที่ user บันทึกไว้เข้าช่อง user-input (footer) และแสดงลายเซ็นถ้ามี
        if (data.userData) {
            try {
                const ui = data.userData;
                const checkLogin = document.getElementById('test1');
                if (checkLogin) checkLogin.checked = !!ui.login;
                const checkSoft = document.getElementById('test2');
                if (checkSoft) checkSoft.checked = !!ui.software;
                const checkShare = document.getElementById('test3');
                if (checkShare) checkShare.checked = !!ui.sharing;
                const otherInput = document.querySelector('.test-section input[type="text"].user-input');
                if (otherInput) otherInput.value = ui.otherText || '';
                const sig = document.querySelector('.signature-line.user-input');
                if (sig) sig.value = ui.name || '';

                // แสดงลายเซ็นของ user ใน preview (ถ้ามี)
                if (ui.signatures) {
                    if (ui.signatures.sig1) {
                        const up1 = document.querySelector('#userPreview1 img');
                        if (up1) { up1.src = ui.signatures.sig1; up1.style.display = 'block'; document.getElementById('userPreview1').classList.add('has-image'); const c1 = document.getElementById('userCancel1'); if (c1) c1.style.display = 'inline-block'; }
                    }
                    if (ui.signatures.sig2) {
                        const up2 = document.querySelector('#userPreview2 img');
                        if (up2) { up2.src = ui.signatures.sig2; up2.style.display = 'block'; document.getElementById('userPreview2').classList.add('has-image'); const c2 = document.getElementById('userCancel2'); if (c2) c2.style.display = 'inline-block'; }
                    }

                    // ถ้าเป็น admin ให้แสดงส่วนแยกสำหรับดูลายเซ็นของ user
                    if (role === 'admin') {
                        const display = document.getElementById('user-signatures-display');
                        if (display) {
                            display.innerHTML = '';
                            if (ui.signatures.sig1) {
                                const d1 = document.createElement('div');
                                d1.innerHTML = `<div><strong>ลายเซ็นผู้รับมอบ (1)</strong><br><img src="${ui.signatures.sig1}" style="max-width:220px; height:auto; border:1px solid #ccc; padding:4px;"/></div>`;
                                display.appendChild(d1);
                            }
                            if (ui.signatures.sig2) {
                                const d2 = document.createElement('div');
                                d2.innerHTML = `<div style="margin-top:8px;"><strong>ลายเซ็นผู้รับมอบ (2)</strong><br><img src="${ui.signatures.sig2}" style="max-width:220px; height:auto; border:1px solid #ccc; padding:4px;"/></div>`;
                                display.appendChild(d2);
                            }
                            // แสดงวันที่รับมอบถ้ามี
                            if (ui.deliveryDate || ui.date) {
                                const d3 = document.createElement('div');
                                d3.style.marginTop = '8px';
                                d3.innerHTML = `<div><strong>วันที่รับมอบ:</strong> ${ui.deliveryDate || ui.date}</div>`;
                                display.appendChild(d3);
                            }
                        }
                    }
                }

            } catch (e) { console.error('populate userData error', e); }
        }

        // แสดงลายเซ็นของ admin ถ้ามี และตั้งค่า UI ให้เหมาะสม (ถ้าเป็นรายการที่สร้างแล้วไม่ให้แก้ admin fields)
        if (data.signatures) {
            try {
                if (data.signatures.it) {
                    const itImg = document.querySelector('#itPreview img');
                    if (itImg) { itImg.src = data.signatures.it; itImg.style.display = 'block'; document.getElementById('itPreview').classList.add('has-image'); const c = document.getElementById('itCancel'); if (c) c.style.display = 'inline-block'; }
                }
                if (data.signatures.mgr) {
                    const mgrImg = document.querySelector('#mgrPreview img');
                    if (mgrImg) { mgrImg.src = data.signatures.mgr; mgrImg.style.display = 'block'; document.getElementById('mgrPreview').classList.add('has-image'); const c2 = document.getElementById('mgrCancel'); if (c2) c2.style.display = 'inline-block'; }
                }
            } catch (e) { console.error('populate signatures error', e); }
        }

                // เติมวันที่รับมอบของผู้ใช้ (ถ้ามี) เข้าใน input date ของหน้า
                try {
                    const dateInput = document.querySelector('.signature-row input[type="date"].user-input');
                    if (dateInput) dateInput.value = (data.userData && (data.userData.deliveryDate || data.userData.date)) || dateInput.value || '';
                } catch (e) { /* ignore */ }

        // ถ้านี่คือรายการที่สร้างขึ้น (ไม่ใช่ template) ให้ปิดการแก้ไข admin-fields ยกเว้นการอัปโหลดรูปและปุ่ม submit
        if (role === 'admin' && (data.createdFrom || data.userData)) {
            document.querySelectorAll('.admin-input').forEach(el => {
                // keep file inputs enabled
                if (el.type === 'file' || el.classList.contains('upload-btn') || el.id === 'itCancel' || el.id === 'mgrCancel') return;
                el.disabled = true;
            });
            // show submit wrapper if signatures are present or will be attached
            updateShowSubmitButton();
        }

    } catch (err) {
        console.error('loadChecklist error', err);
    }
}


// ตัวแปรควบคุมโหมดแก้ไขข้อความ (true = แก้ไขได้)
let isEditEnabled = false;

// ดึงค่า id (assetId) จาก URL
const urlParams = new URLSearchParams(window.location.search);
const assetId = urlParams.get('id');


/*****************************************************
 * ฟังก์ชันบันทึกข้อมูลผู้ใช้งาน (LocalStorage)
 *****************************************************/
function saveUserData() {
    // ดึงชื่อผู้ใช้งานจากช่องลายเซ็น
    const userName = document.querySelector('.signature-line')?.value || 'UnknownUser';

    // รวบรวมข้อมูลจาก checkbox และ input
    const data = {
        login: document.querySelector('#check-login')?.checked || false,
        software: document.querySelector('#check-software')?.checked || false,
        sharing: document.querySelector('#check-sharing')?.checked || false,
        otherText: document.querySelector('#input-other')?.value || "",
        lastUpdate: new Date().toLocaleString('th-TH'),
        status: "เสร็จสมบูรณ์"
    };

    // บันทึกข้อมูลลง LocalStorage
    localStorage.setItem(`data_${userName}`, JSON.stringify(data));

    alert(`บันทึกข้อมูลของ ${userName} เรียบร้อยแล้ว`);
}


/*****************************************************
 * ฟังก์ชันสร้าง Checklist ใหม่ (Admin)
 *****************************************************/
async function createNewChecklist() {
    try {
        const db = getDatabase();
        const dbRef = ref(db, 'checklists');

        // ข้อมูลเริ่มต้นของ Checklist
        const initialData = {
            adminData: {
                status: "Pending",
                createAt: new Date().toISOString()
            }
        };

        // สร้าง ID อัตโนมัติจาก Firebase
        const newDoc = await push(dbRef, initialData);
        const newId = newDoc.key;

        // ไปยังหน้าตั้งค่าในโหมด Admin
        window.location.href = `index.html?role=admin&id=${newId}`;
    } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
    }
}


/*****************************************************
 * แสดง Preview รูปภาพก่อนอัปโหลด
 *****************************************************/
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const img = preview.querySelector('img');
    const placeholder = preview.querySelector('.preview-placeholder');
    const cancelBtn = document.getElementById(previewId.replace('Preview', 'Cancel'));

    if (!input.files || !input.files[0]) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        img.src = e.target.result;
        img.style.display = 'block';
        placeholder.style.display = 'none';
        preview.classList.add('has-image');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        // เมื่อแนบไฟล์ลายเซ็น ให้ตรวจสอบและแสดงปุ่มส่งสุดท้าย
        updateShowSubmitButton();
    };

    reader.readAsDataURL(input.files[0]);
}


/*****************************************************
 * ยกเลิกรูปภาพที่เลือก
 *****************************************************/
function cancelImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const img = preview.querySelector('img');
    const placeholder = preview.querySelector('.preview-placeholder');
    const cancelBtn = document.getElementById(previewId.replace('Preview', 'Cancel'));

    input.value = '';
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'block';
    preview.classList.remove('has-image');
    if (cancelBtn) cancelBtn.style.display = 'none';
    // update submit visibility after removal
    try { updateShowSubmitButton(); } catch(e) {}
}




/*****************************************************
 * ตรวจสอบ Role (Admin / User) และตั้งค่าหน้าเว็บ
 *****************************************************/

    
  

// //         โหลดข้อมูล Admin จาก Firebase (ดูได้อย่างเดียว)
//         if (assetId) {
//             const db = getDatabase();
//             const snapshot = await get(ref(db, `checklists/${assetId}/adminData`));
//             if (snapshot.exists()) {
//                 const adminData = snapshot.val();
//                 adminInputs.forEach((el, i) => {
//                     const val = adminData[`item_${i}`];
//                     el.type === 'checkbox' ? el.checked = val : el.value = val || '';
//                 });
//             }
//         }
    
// // บันทึก role หลังล็อกอิน
// localStorage.setItem('role', 'admin'); // หรือ 'user'

// โหลด role ทุกหน้า


// ปุ่มเปลี่ยนหน้า (ใช้ data-goto)
    document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => {
            window.location.href = el.dataset.goto;
        });
    });



async function saveAllToFirebase() {
    try {
        const params = new URLSearchParams(window.location.search);
        const role = params.get('role') || 'user';
        let assetId = params.get('id');

        // 🔹 ถ้ายังไม่มี id → สร้างครั้งเดียว (Admin เท่านั้น)
        if (!assetId && role === 'admin') {
            const newRef = await push(ref(db, 'checklists'), {
                adminData: {
                    status: 'Pending',
                    createdAt: new Date().toISOString()
                }
            });
            assetId = newRef.key;

            // update URL โดยไม่ reload หน้า
            window.history.replaceState(null, '', `?role=admin&id=${assetId}`);
        }

        
        // 🔹 แยกบันทึกตาม role
        if (role === 'admin') {
            const adminData = {
                status: 'Waiting for user',
                updatedAt: new Date().toISOString()
            };

            // สร้าง snapshot และโครงสร้าง adminValues แล้ว push เป็นเอนทรี่ใหม่เสมอ
            try {
                const tableEl = document.querySelector('.main-table');
                let snapshotHtml = '';
                const adminValues = {};

                if (tableEl) {
                    // build snapshot
                    const clone = tableEl.cloneNode(true);

                    // convert inputs to text in clone
                    clone.querySelectorAll('input[type="text"], textarea').forEach(inp => {
                        const span = document.createElement('span');
                        span.textContent = inp.value || '';
                        inp.parentNode.replaceChild(span, inp);
                    });
                    clone.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        const span = document.createElement('span');
                        span.textContent = cb.checked ? '✓' : '';
                        cb.parentNode.replaceChild(span, cb);
                    });
                    clone.querySelectorAll('.can-edit').forEach(el => {
                        const txt = document.createElement('div');
                        txt.textContent = el.textContent || '';
                        el.parentNode.replaceChild(txt, el);
                    });

                    snapshotHtml = clone.outerHTML;

                    // collect structured adminValues from current DOM
                    const rows = document.querySelectorAll('.main-table tbody tr');
                    rows.forEach((tr, i) => {
                        const resultInput = tr.querySelector('input[type="text"].admin-input') || tr.querySelector('textarea.admin-input');
                        const checkboxes = {};
                        tr.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            const lbl = cb.parentNode ? (cb.parentNode.textContent || '').trim() : '';
                            checkboxes[lbl || `cb_${i}`] = !!cb.checked;
                        });
                        adminValues[i] = {
                            result: resultInput ? (resultInput.value || '') : '',
                            checkboxes
                        };
                    });
                }

                // push new entry so every save creates a fresh checklist id
                const newRef = await push(ref(db, 'checklists'), {
                    adminData,
                    adminValues,
                    adminSnapshot: snapshotHtml,
                    createdFrom: assetId || null
                });
                const newId = newRef.key;

                // create a link for the user that requires login (no role param)
                if (!newId) throw new Error('ไม่สามารถสร้าง ID ได้');
                const userUrl = `${window.location.origin}/index.html?id=${newId}`;
                showLinkAlert('บันทึกข้อมูล Admin สำเร็จ', 'ส่งลิงก์นี้ให้ User (ผู้รับต้องล็อกอินก่อนทำแบบฟอร์ม)', userUrl);

            } catch (e) {
                console.error('save snapshot error', e);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล Admin: ' + e.message);
            }

        } else {
            // อ่านค่าจริงตาม ID ของอินพุตในหน้า (test1/test2/test3 และกล่องข้อความถัดจาก test4)
        const otherInputEl = document.querySelector('#test4')?.parentElement?.querySelector('input[type="text"].user-input');
        const deliveryDateVal = document.querySelector('.signature-row input[type="date"].user-input')?.value || '';
        const userData = {
                login: document.getElementById('test1')?.checked || false,
                software: document.getElementById('test2')?.checked || false,
                sharing: document.getElementById('test3')?.checked || false,
                other: document.getElementById('test4')?.checked || false,
                otherText: otherInputEl ? (otherInputEl.value || '') : '',
            name: document.querySelector('.signature-line.user-input')?.value || params.get('name') || localStorage.getItem('name') || '',
            deliveryDate: deliveryDateVal,
                status: 'Completed',
                updatedAt: new Date().toISOString()
            };

            
            // 👉 ลิงก์กลับไปให้ Admin
            if (!assetId) throw new Error('ไม่พบ assetId');

            const adminUrl = `${window.location.origin}/index.html?role=admin&id=${encodeURIComponent(assetId)}`;

            // บันทึก userData ลง Firebase (under checklists/{assetId}/userData)
            try {
                // include any user signature images from preview(s)
                try {
                    const up1 = document.querySelector('#userPreview1 img');
                    if (up1 && up1.src) {
                        userData.signatures = userData.signatures || {};
                        userData.signatures.sig1 = up1.src;
                    }
                } catch (e) { /* ignore */ }

                await update(ref(db, `checklists/${assetId}/userData`), userData);
            } catch (e) {
                console.error('save userData error', e);
                alert('บันทึกข้อมูลผู้ใช้ไม่สำเร็จ: ' + e.message);
                return;
            }

            showLinkAlert(
                'บันทึกข้อมูล User สำเร็จ',
                'ส่งลิงก์นี้กลับให้ Admin',
                adminUrl
            );
        }

    } catch (err) {
        alert('❌ เกิดข้อผิดพลาด: ' + err.message);
        console.error(err);
    }
}
function showLinkAlert(title, message, url) {
    const html = `\n${title}\n\n${message}\n${url}\n`;
    // try copy to clipboard with fallback
    (async () => {
        try {
            await navigator.clipboard.writeText(url);
            alert(html + '\n(ลิงก์ถูกคัดลอกไปยังคลิปบอร์ดแล้ว)');
        } catch (e) {
            // fallback: prompt so user can copy manually
            window.prompt('คัดลอกลิงก์นี้', url);
        }
    })();
}

// ตรวจสอบว่ามีการแนบลายเซ็นของ Admin แล้วหรือยัง
function updateShowSubmitButton() {
    const itPreview = document.getElementById('itPreview');
    const mgrPreview = document.getElementById('mgrPreview');
    const submitBtn = document.getElementById('final-submit');

    // Require both admin signatures (IT and Manager) before showing final submit
    const hasIt = itPreview && itPreview.classList.contains('has-image');
    const hasMgr = mgrPreview && mgrPreview.classList.contains('has-image');
    const hasBoth = !!(hasIt && hasMgr);

    if (submitBtn) {
        submitBtn.style.display = hasBoth ? 'inline-block' : 'none';
    }

    const wrapper = document.getElementById('final-submit-wrap');
    if (wrapper) wrapper.style.display = hasBoth ? 'inline-block' : 'none';
}

// ฟังก์ชันส่งขั้นตอนสุดท้าย (Admin กดปุ่มเมื่อแนบลายเซ็น)
async function finalSubmit() {
    try {
        const params = new URLSearchParams(window.location.search);
        const assetId = params.get('id');
        if (!assetId) throw new Error('ไม่พบ assetId');

        // อ่านรูปจาก preview (dataURL) แล้วบันทึกลง Firebase (ภายใต้ checklists/{id}/signatures)
        const itImg = document.querySelector('#itPreview img');
        const mgrImg = document.querySelector('#mgrPreview img');

        const updates = {};
        if (itImg && itImg.src) updates[`checklists/${assetId}/signatures/it`] = itImg.src;
        if (mgrImg && mgrImg.src) updates[`checklists/${assetId}/signatures/mgr`] = mgrImg.src;

        // ตั้งสถานะเป็น Submitted
        updates[`checklists/${assetId}/adminData/status`] = 'Submitted';
        updates[`checklists/${assetId}/adminData/submittedAt`] = new Date().toISOString();

        await update(ref(db), updates);

        alert('ส่งเอกสารเรียบร้อยแล้ว (ส่งลายเซ็นและอัพเดตสถานะ)');
        updateShowSubmitButton();
    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการส่ง: ' + err.message);
    }
}

// expose to global
window.finalSubmit = finalSubmit;
window.updateShowSubmitButton = updateShowSubmitButton;


// Search checklists by user name (admin)
async function searchChecklistByName(name) {
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    if (!name || !name.trim()) {
        container.textContent = 'กรุณากรอกชื่อที่ต้องการค้นหา';
        return;
    }

    try {
        const snapshot = await get(ref(db, 'checklists'));
        if (!snapshot.exists()) {
            container.textContent = 'ไม่พบรายการใดๆ';
            return;
        }
        const all = snapshot.val();
        const results = [];
        Object.keys(all).forEach(k => {
            const item = all[k];
            if (item.userData && item.userData.name && item.userData.name.toLowerCase().includes(name.toLowerCase())) {
                results.push({ id: k, item });
            }
        });

        if (results.length === 0) {
            container.textContent = 'ไม่พบผู้ใช้ที่ค้นหา';
            return;
        }

        const ul = document.createElement('ul');
        results.forEach(r => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="index.html?role=admin&id=${r.id}">เปิดรายการ: ${r.item.userData.name} (ID: ${r.id})</a>`;
            ul.appendChild(li);
        });
        container.appendChild(ul);

    } catch (e) {
        console.error('search error', e);
        container.textContent = 'เกิดข้อผิดพลาดในการค้นหา';
    }
}

// Export ให้ global ถ้าต้องเรียกจาก onclick HTML


/*****************************************************
 * export เป็น global (กรณีจำเป็น)
 *****************************************************/
 window.saveUserData = saveUserData;
window.createNewChecklist = createNewChecklist;
window.cancelImage = cancelImage;
window.saveAllToFirebase = saveAllToFirebase;
// expose previewImage to inline handlers in HTML (scripts are loaded as modules)
window.previewImage = previewImage;