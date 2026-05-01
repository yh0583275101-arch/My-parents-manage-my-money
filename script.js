const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let currentPassword = "";
let transactions = [];

async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        currentPassword = data.password;
        transactions = data.transactions;

        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            showMainScreen();
        } else if (!currentPassword) {
            document.getElementById('auth-screen').style.display = 'flex';
            document.getElementById('auth-title').innerText = "קביעת סיסמה ראשונית";
        }
    } catch (e) {
        showAlert("שגיאה בטעינת נתונים. וודא שה-URL תקין.");
    }
}

async function handleAuth() {
    const input = document.getElementById('password-input').value;
    if (!input) return showAlert("נא להזין סיסמה");

    if (!currentPassword) {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "setPassword", newPass: input }) });
        showAlert("הסיסמה נקבעה בהצלחה!");
        setTimeout(() => location.reload(), 1500);
    } else if (input === currentPassword) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showMainScreen();
    } else {
        showAlert("סיסמה שגויה!");
    }
}

function showMainScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'flex';
    document.getElementById('side-menu').style.display = 'flex';
    render();
}

function render() {
    const list = document.getElementById('transactions-list');
    const totalEl = document.getElementById('total-balance');
    let total = 0;
    list.innerHTML = "";

    // מיון מהחדש לישן
    [...transactions].reverse().forEach(t => {
        const income = t[2] !== "" ? parseFloat(t[2]) : 0;
        const expense = t[3] !== "" ? parseFloat(t[3]) : 0;
        const amt = income > 0 ? income : -expense;
        total += amt;

        const date = new Date(t[0]).toLocaleDateString('he-IL');
        
        list.innerHTML += `
            <div class="item">
                <div class="item-info">
                    <span class="item-date">${date}</span>
                    <span class="item-desc">${t[1]}</span>
                </div>
                <span class="${amt >= 0 ? 'amount-pos' : 'amount-neg'}">${amt.toLocaleString()} ₪</span>
            </div>`;
    });
    totalEl.innerText = total.toLocaleString() + " ₪";
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
    const oldP = document.getElementById('old-p').value;
    const newP = document.getElementById('new-p').value;

    if (oldP !== currentPassword) return showAlert("סיסמה נוכחית שגויה");
    if (!newP) return showAlert("נא להזין סיסמה חדשה");

    closeModal();
    showAlert("מעדכן סיסמה...");
    await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "setPassword", newPass: newP }) });
    location.reload();
}

function openModal(type) {
    const modal = document.getElementById('action-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const btn = document.getElementById('modal-confirm-btn');
    
    document.getElementById('main-wrapper').classList.add('blur');
    modal.style.display = 'flex';

    if (type === 'plus' || type === 'minus') {
        title.innerText = type === 'plus' ? 'הוספת סכום' : 'הורדת סכום';
        body.innerHTML = `
            <input type="number" id="modal-amount" placeholder="סכום (₪)">
            <input type="text" id="modal-desc" placeholder="תיאור הפעולה">
        `;
        btn.onclick = () => submitAction(type);
        btn.className = type === 'plus' ? 'btn-plus' : 'btn-minus';
    } else if (type === 'password') {
        title.innerText = "שינוי סיסמה";
        body.innerHTML = `
            <input type="password" id="old-p" placeholder="סיסמה נוכחית">
            <input type="password" id="new-p" placeholder="סיסמה חדשה">
        `;
        btn.onclick = updatePassword;
        btn.className = 'btn-plus';
    }
}

function closeModal() {
    document.getElementById('action-modal').style.display = 'none';
    document.getElementById('main-wrapper').classList.remove('blur');
}

function showAlert(text) {
    document.getElementById('alert-text').innerText = text;
    document.getElementById('alert-overlay').style.display = 'flex';
}

function closeAlert() {
    document.getElementById('alert-overlay').style.display = 'none';
}

function exportToExcel() {
    let csv = "\ufeffתאריך,תיאור,הכנסה,הוצאה\n";
    transactions.forEach(t => {
        csv += `${new Date(t[0]).toLocaleDateString('he-IL')},${t[1]},${t[2] || ""},${t[3] || ""}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `דוח_כספי_${new Date().toLocaleDateString('he-IL')}.csv`;
    link.click();
}

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    location.reload();
}

init();
