const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let currentPassword = "";
let transactions = [];

async function init() {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    currentPassword = data.password;
    transactions = data.transactions;

    // בדיקה אם כבר מחובר ב-Session (לא מתנתק ברענון)
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        showMainScreen();
    } else if (!currentPassword) {
        // רק אם אין בכלל סיסמה בשיטס - מצב הגדרה ראשונית
        document.getElementById('auth-screen').style.display = 'flex';
        document.querySelector('#auth-screen h2').innerText = "קביעת סיסמה ראשונית";
    }
}

async function handleAuth() {
    const input = document.getElementById('password-input').value;
    
    if (!currentPassword) {
        // הגדרה ראשונית
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "setPassword", newPass: input }) });
        showAlert("הסיסמה הוגדרה בהצלחה! האתר יתרענן.");
        setTimeout(() => location.reload(), 2000);
    } else if (input === currentPassword) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showMainScreen();
    } else {
        showAlert("סיסמה שגויה!");
    }
}

function showMainScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    render();
}

// מערכת התראות מעוצבת
function showAlert(text) {
    document.getElementById('alert-text').innerText = text;
    document.getElementById('alert-overlay').style.display = 'flex';
}

function closeAlert() {
    document.getElementById('alert-overlay').style.display = 'none';
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
            <input type="number" id="modal-amount" placeholder="סכום">
            <input type="text" id="modal-desc" placeholder="תיאור">
        `;
        btn.innerText = "בצע פעולה";
        btn.onclick = () => submitAction(type);
    } else if (type === 'password') {
        title.innerText = "שינוי סיסמה";
        body.innerHTML = `
            <input type="password" id="old-p" placeholder="סיסמה נוכחית">
            <input type="password" id="new-p" placeholder="סיסמה חדשה">
        `;
        btn.innerText = "עדכן סיסמה";
        btn.onclick = updatePassword;
    }
}

function closeModal() {
    document.getElementById('action-modal').style.display = 'none';
    document.getElementById('main-wrapper').classList.remove('blur');
}

function checkClose(e) {
    if (e.target.id === 'action-modal') closeModal();
}

async function submitAction(type) {
    const amt = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    if(!amt) return showAlert("נא להזין סכום");

    const finalAmt = type === 'plus' ? amt : -amt;
    await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "add", amount: finalAmt, desc: desc }) });
    location.reload();
}

// שאר הפונקציות (render, logout וכו') נשארות דומות...
init();
