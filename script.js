const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let currentPassword = "";
let transactions = [];

async function init() {
    // הסתרת כל האלמנטים בזמן הטעינה
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('side-menu').style.display = 'none';

    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        
        currentPassword = data.password ? data.password.toString() : "";
        transactions = data.transactions || [];

        // בדיקה אם המשתמש כבר מחובר או אם אין סיסמה בכלל
        if (!currentPassword || currentPassword.trim() === "" || sessionStorage.getItem('isLoggedIn') === 'true') {
            showMainScreen();
        } else {
            // הצגת מסך כניסה בלבד
            document.getElementById('auth-screen').style.display = 'flex';
        }
    } catch (e) {
        console.error("שגיאה בטעינת הנתונים:", e);
        alert("חלה שגיאה בחיבור לשרת. נא לרענן את הדף.");
    }
}

async function handleAuth() {
    const input = document.getElementById('password-input').value;
    
    if (input.toString() === currentPassword) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showMainScreen();
    } else {
        showAlert("סיסמה שגויה!");
    }
}

function showMainScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'flex'; // שימוש ב-flex להתאמה ל-CSS
    document.getElementById('side-menu').style.display = 'flex';   // הצגת התפריט הימני
    render();
}

function render() {
    const list = document.getElementById('transactions-list');
    const totalEl = document.getElementById('total-balance');
    let total = 0;
    list.innerHTML = "";

    if (transactions && transactions.length > 0) {
        [...transactions].reverse().forEach(t => {
            const income = t[2] !== "" ? parseFloat(t[2]) : 0;
            const expense = t[3] !== "" ? parseFloat(t[3]) : 0;
            const amt = income > 0 ? income : -expense;
            total += amt;

            const date = t[0] ? new Date(t[0]).toLocaleDateString('he-IL') : "---";
            
            list.innerHTML += `
                <div class="item">
                    <div class="item-info">
                        <small style="color: #5f6368;">${date}</small>
                        <div style="font-weight: 500; font-size: 1.1rem;">${t[1] || "ללא תיאור"}</div>
                    </div>
                    <span class="${amt >= 0 ? 'amount-pos' : 'amount-neg'}" style="font-size: 1.2rem;">
                        ${amt.toLocaleString()} ₪
                    </span>
                </div>`;
        });
    } else {
        list.innerHTML = "<p style='text-align:center; color:#5f6368;'>אין פעולות להצגה</p>";
    }
    totalEl.innerText = total.toLocaleString() + " ₪";
}

function openModal(type) {
    const modal = document.getElementById('action-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const btn = document.getElementById('modal-confirm-btn');
    
    document.getElementById('main-wrapper').style.filter = 'blur(5px)';
    modal.style.display = 'flex';

    if (type === 'plus' || type === 'minus') {
        title.innerText = type === 'plus' ? 'הוספת סכום' : 'הורדת סכום';
        body.innerHTML = `
            <input type="number" id="modal-amount" placeholder="סכום (₪)" style="width:100%; padding:12px; margin:10px 0; border:1px solid #dadce0; border-radius:4px;">
            <input type="text" id="modal-desc" placeholder="תיאור הפעולה" style="width:100%; padding:12px; margin:10px 0; border:1px solid #dadce0; border-radius:4px;">
        `;
        btn.className = type === 'plus' ? 'btn-plus' : 'btn-minus';
        btn.onclick = () => submitAction(type);
    } else if (type === 'password') {
        title.innerText = currentPassword ? "שינוי סיסמה" : "הגדרת סיסמה";
        body.innerHTML = `
            ${currentPassword ? '<input type="password" id="old-p" placeholder="סיסמה נוכחית" style="width:100%; padding:12px; margin:10px 0; border:1px solid #dadce0; border-radius:4px;">' : ''}
            <input type="password" id="new-p" placeholder="סיסמה חדשה" style="width:100%; padding:12px; margin:10px 0; border:1px solid #dadce0; border-radius:4px;">
        `;
        btn.className = 'btn-plus';
        btn.onclick = updatePassword;
    }
}

function closeModal() {
    document.getElementById('action-modal').style.display = 'none';
    document.getElementById('main-wrapper').style.filter = 'none';
}

async function submitAction(type) {
    const amt = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    if (!amt) return showAlert("נא להזין סכום");

    closeModal();
    showAlert("שומר נתונים...");
    const finalAmt = type === 'plus' ? amt : -amt;
    await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "add", amount: finalAmt, desc: desc }) });
    location.reload();
}

async function updatePassword() {
    const newP = document.getElementById('new-p').value;
    if (currentPassword) {
        const oldP = document.getElementById('old-p').value;
        if (oldP !== currentPassword) return showAlert("סיסמה נוכחית שגויה");
    }
    if (!newP) return showAlert("נא להזין סיסמה");

    closeModal();
    showAlert("מעדכן...");
    await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "setPassword", newPass: newP }) });
    location.reload();
}

function exportToExcel() {
    let csv = "\ufeffתאריך,תיאור,הכנסה,הוצאה\n";
    transactions.forEach(t => {
        csv += `${new Date(t[0]).toLocaleDateString('he-IL')},${t[1]},${t[2] || ""},${t[3] || ""}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `דוח_כספי.csv`;
    link.click();
}

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    location.reload();
}

function showAlert(text) {
    const alertOverlay = document.getElementById('alert-overlay');
    if (alertOverlay) {
        document.getElementById('alert-text').innerText = text;
        alertOverlay.style.display = 'flex';
    } else {
        alert(text);
    }
}

function closeAlert() {
    document.getElementById('alert-overlay').style.display = 'none';
}

// הפעלת האפליקציה
init();
