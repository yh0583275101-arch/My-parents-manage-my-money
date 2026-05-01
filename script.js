const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let currentPassword = "";
let transactions = [];
let isFirstLogin = false;

// בדיקת מצב התחברות בטעינה (לא מתנתק ברענון)
async function init() {
    showToast("טוען נתונים...");
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    currentPassword = data.password;
    transactions = data.transactions;

    if (!currentPassword) {
        isFirstLogin = true;
        document.getElementById('auth-title').innerText = "קביעת סיסמה ראשונית";
    }

    // אם כבר התחבר בעבר בדפדפן הזה
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        showMainScreen();
    }
}

async function handleAuth() {
    const input = document.getElementById('password-input').value;
    if (isFirstLogin) {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "setPassword", newPass: input }) });
        showToast("הסיסמה נקבעה! נא לרענן.");
        setTimeout(() => location.reload(), 1500);
    } else if (input === currentPassword) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showMainScreen();
    } else {
        showToast("סיסמה שגויה!");
    }
}

function showMainScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    render();
}

function openModal(type) {
    const modal = document.getElementById('action-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    document.getElementById('main-content').classList.add('blur');
    modal.style.display = 'flex';
    body.innerHTML = '';

    if (type === 'plus' || type === 'minus') {
        title.innerText = type === 'plus' ? 'הוספת כסף' : 'הורדת כסף';
        body.innerHTML = `
            <input type="number" id="modal-amount" placeholder="סכום">
            <input type="text" id="modal-desc" placeholder="תיאור">
        `;
        confirmBtn.onclick = () => submitAction(type);
        confirmBtn.className = type === 'plus' ? 'btn-plus' : 'btn-minus';
    } else if (type === 'password') {
        title.innerText = 'שינוי סיסמה';
        body.innerHTML = `
            <input type="password" id="old-pass" placeholder="סיסמה נוכחית">
            <input type="password" id="new-pass" placeholder="סיסמה חדשה">
        `;
        confirmBtn.onclick = updatePassword;
        confirmBtn.className = 'btn-plus';
    }
}

async function submitAction(type) {
    const amount = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    if (!amount) return showToast("נא להזין סכום");

    const finalAmount = type === 'plus' ? amount : -amount;
    showToast("שומר...");
    await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "add", amount: finalAmount, desc: desc }) });
    location.reload();
}

function closeModal() {
    document.getElementById('action-modal').style.display = 'none';
    document.getElementById('main-content').classList.remove('blur');
}

function render() {
    const list = document.getElementById('transactions-list');
    let total = 0;
    list.innerHTML = "";

    [...transactions].reverse().forEach(t => {
        const income = t[2] !== "" ? parseFloat(t[2]) : 0;
        const expense = t[3] !== "" ? parseFloat(t[3]) : 0;
        const amt = income > 0 ? income : -expense;
        total += amt;

        list.innerHTML += `
            <div class="item">
                <span><strong>${new Date(t[0]).toLocaleDateString()}</strong> - ${t[1]}</span>
                <span class="${amt >= 0 ? 'amount-pos' : 'amount-neg'}">${amt} ₪</span>
            </div>`;
    });
    document.getElementById('total-balance').innerText = total + " ₪";
}

function showToast(msg) {
    const toast = document.getElementById('custom-toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    location.reload();
}

init();
