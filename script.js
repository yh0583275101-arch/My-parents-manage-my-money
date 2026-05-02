// וודא שכתובת ה-URL הזו מעודכנת ומפורסמת כ-Deployment תקין בגוגל
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let currentPassword = "";
let transactions = [];

// פונקציית הטעינה הראשונית
async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        currentPassword = data.password ? data.password.toString() : "";
        transactions = data.transactions || [];

        if (!currentPassword || sessionStorage.getItem('isLoggedIn') === 'true') {
            showMainScreen();
        } else {
            document.getElementById('auth-screen').style.display = 'flex';
        }
    } catch (e) {
        console.error("שגיאה בחיבור:", e);
    }
}

// כניסה למערכת
async function handleAuth() {
    const input = document.getElementById('password-input').value;
    if (input === currentPassword) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showMainScreen();
    } else {
        alert("סיסמה שגויה!");
    }
}

function showMainScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('side-menu').style.display = 'flex';
    document.getElementById('main-content').style.display = 'flex';
    render();
}

// פתיחת חלון קופץ מודרני
function openModal(type) {
    const modal = document.getElementById('action-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const btn = document.getElementById('modal-confirm-btn');

    modal.style.display = 'flex';

    if (type === 'plus' || type === 'minus') {
        title.innerText = type === 'plus' ? 'הוספת סכום' : 'הורדת סכום';
        body.innerHTML = `
            <input type="number" id="modal-amount" placeholder="סכום (₪)" autofocus>
            <input type="text" id="modal-desc" placeholder="תיאור (למשל: קניות, משכורת)">
        `;
        btn.onclick = () => submitAction(type);
    } else if (type === 'password') {
        title.innerText = "הגדרת סיסמה";
        body.innerHTML = `
            <input type="password" id="new-p" placeholder="סיסמה חדשה">
        `;
        btn.onclick = updatePassword;
    }
}

function closeModal() {
    document.getElementById('action-modal').style.display = 'none';
}

// שמירת פעולה
async function submitAction(type) {
    const amt = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    if (!amt) return alert("נא להזין סכום");

    closeModal();
    const finalAmt = type === 'plus' ? amt : -amt;
    
    // שליחת הנתונים לגוגל
    await fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', // פותר בעיות CORS מול גוגל
        body: JSON.stringify({ action: "add", amount: finalAmt, desc: desc }) 
    });
    
    setTimeout(() => location.reload(), 500); // רענון קל לעדכון הנתונים
}

// הורדה לאקסל (תיקון באג הורדה)
function exportToExcel() {
    if (!transactions.length) return alert("אין נתונים לייצוא");
    
    let csv = "\ufeffתאריך,תיאור,הכנסה,הוצאה\n";
    transactions.forEach(t => {
        const date = t[0] ? new Date(t[0]).toLocaleDateString('he-IL') : "";
        csv += `${date},${t[1]},${t[2] || ""},${t[3] || ""}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'ניהול_כספים.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// רינדור הנתונים למסך
function render() {
    const list = document.getElementById('transactions-list');
    const totalEl = document.getElementById('total-balance');
    let total = 0;
    list.innerHTML = "";

    transactions.slice().reverse().forEach(t => {
        const income = parseFloat(t[2]) || 0;
        const expense = parseFloat(t[3]) || 0;
        const amt = income > 0 ? income : -expense;
        total += amt;

        const date = t[0] ? new Date(t[0]).toLocaleDateString('he-IL') : "---";
        list.innerHTML += `
            <div class="item">
                <div>
                    <div style="font-weight:600">${t[1] || "ללא תיאור"}</div>
                    <small style="color:#718096">${date}</small>
                </div>
                <div class="${amt >= 0 ? 'amount-pos' : 'amount-neg'}">${amt.toLocaleString()} ₪</div>
            </div>`;
    });
    totalEl.innerText = total.toLocaleString() + " ₪";
}

init();
