const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxg7mcXrDhZt6XdlBZz6rV-gsKhNL0627BaXEooUm-ejag7FifNkYNFrJkTOY7pZykE/exec";
let transactions = [];
let appPassword = "";

// חלון התראות מעוצב
function showCustomAlert(title, message) {
    let existingAlert = document.getElementById('custom-alert-box');
    if (existingAlert) existingAlert.remove();

    const alertHTML = `
        <div id="custom-alert-box" class="overlay" style="display: flex;">
            <div class="modal" style="text-align: center;">
                <h2 style="color: #dc3545; margin-top: 0;">${title}</h2>
                <p style="font-size: 16px; margin-bottom: 20px; color: #333;">${message}</p>
                <button class="btn-secondary" style="width: 100%;" onclick="document.getElementById('custom-alert-box').remove()">הבנתי וסגור</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHTML);
}

// אתחול
async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        appPassword = data.password || ""; 
        render();
        document.getElementById('auth-screen').style.display = 'flex';
    } catch (e) { 
        showCustomAlert("שגיאת תקשורת", "יש בעיה בטעינת הנתונים.");
    }
}

// כניסה
function handleAuth() {
    const passInput = document.getElementById('password-input').value.trim();
    const correctPassword = String(appPassword).trim();

    if (passInput === correctPassword && correctPassword !== "") {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('side-menu').style.display = 'flex';
        document.getElementById('main-content').style.display = 'flex';
    } else {
        showCustomAlert("שגיאה", "הסיסמה שהזנת שגויה, נסה שוב.");
    }
}

function logout() {
    document.getElementById('password-input').value = "";
    document.getElementById('side-menu').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
}

// תצוגה
function render() {
    const list = document.getElementById('transactions-list');
    const totalEl = document.getElementById('total-balance');
    if (!list || !totalEl) return;
    
    let total = 0;
    list.innerHTML = "";

    // חישוב יתרה כוללת (פלוס ומינוס מאותה עמודה)
    transactions.forEach(t => {
        let amtC = parseFloat(t[2]) || 0; 
        let amtD = parseFloat(t[3]) || 0; // למקרה שיש נתונים ישנים בעמודה ד'
        total += (amtC - Math.abs(amtD));
    });

    const sortedData = [...transactions].sort((a, b) => new Date(b[0]) - new Date(a[0]));

    sortedData.forEach(t => {
        let amtC = parseFloat(t[2]) || 0;
        let amtD = parseFloat(t[3]) || 0;
        
        let netAmount = amtC - Math.abs(amtD);

        if (netAmount === 0 && amtC === 0 && amtD === 0) return;

        const dateStr = t[0] ? new Date(t[0]).toLocaleString('he-IL', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : "---";

        let amtStr, colorClass;

        if (netAmount > 0) {
            amtStr = `+ ${netAmount.toLocaleString()} ₪`;
            colorClass = "amount-pos";
        } else {
            amtStr = `- ${Math.abs(netAmount).toLocaleString()} ₪`;
            colorClass = "amount-neg";
        }

        list.innerHTML += `
            <div class="item">
                <div style="text-align: right;">
                    <div style="font-weight:600; font-size: 1.1rem; color: #2d3436;">${t[1] || "ללא תיאור"}</div>
                    <small style="color:gray">${dateStr}</small>
                </div>
                <div class="${colorClass}" style="font-size: 1.2rem; word-break: break-all;">${amtStr}</div>
            </div>`;
    });

    totalEl.innerText = total.toLocaleString() + " ₪";
}

// הורדה / הוספה
async function submitAction(type) {
    const amtInput = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    
    let amt = Math.abs(parseFloat(amtInput));
    if (isNaN(amt) || amt === 0) {
        showCustomAlert("שגיאה בהזנה", "חובה להזין סכום תקין.");
        return;
    }

    closeModal();
    
    fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "add", type: type, amount: amt, desc: desc }) 
    });
    
    const now = new Date().toISOString();
    // עדכון מקומי מהיר וזמני
    let tempAmt = (type === 'plus') ? amt : -amt;
    transactions.push([now, desc, tempAmt, ""]);
    
    render();
    setTimeout(refreshData, 2000);
}

// אקסל
function exportToExcel() {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "תאריך,תיאור,הכנסה,הוצאה\n";
    transactions.forEach(t => {
        let date = t[0] ? new Date(t[0]).toLocaleString('he-IL') : "";
        csvContent += `${date},${t[1] || ""},${t[2] || ""},${t[3] || ""}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ניהול_כספים.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- שינוי סיסמה ---
function openPasswordModal() {
    document.getElementById('new-password-input').value = "";
    document.getElementById('password-modal').style.display = 'flex';
}

function closePasswordModal() { document.getElementById('password-modal').style.display = 'none'; }

function submitNewPassword() {
    const newPass = document.getElementById('new-password-input').value.trim();
    if (!newPass) {
        showCustomAlert("שגיאה", "אנא הזן סיסמה חדשה.");
        return;
    }
    closePasswordModal();
    appPassword = newPass;

    fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "change_password", newPassword: newPass }) 
    });
    showCustomAlert("הצלחה", "הסיסמה שונתה בהצלחה בגוגל שיטס!");
}

async function refreshData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        render();
    } catch (e) {}
}

function openModal(type) {
    const modal = document.getElementById('action-modal');
    document.getElementById('modal-title').innerText = type === 'plus' ? 'הוספת סכום' : 'הורדת סכום';
    document.getElementById('modal-body').innerHTML = `
        <input type="number" id="modal-amount" placeholder="סכום (₪)" autofocus min="0">
        <input type="text" id="modal-desc" placeholder="תיאור">`;
    document.getElementById('modal-confirm-btn').onclick = () => submitAction(type);
    modal.style.display = 'flex';
}

function closeModal() { document.getElementById('action-modal').style.display = 'none'; }

init();
