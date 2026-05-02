const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let currentPassword = "";
let transactions = [];

async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        currentPassword = data.password ? data.password.toString() : "";
        transactions = data.transactions || [];

        if (!currentPassword || sessionStorage.getItem('isLoggedIn') === 'true') {
            showMainScreen();
        } else {
            document.body.innerHTML += `<div id='login-overlay' style='position:fixed;top:0;left:0;width:100%;height:100%;background:white;display:flex;justify-content:center;align-items:center;'><div style='text-align:center'><h2>כניסה</h2><input type='password' id='pass' placeholder='סיסמה' style='padding:10px;border-radius:8px;border:1px solid #ccc'><br><br><button onclick='checkLogin()' style='padding:10px 20px;background:#1a73e8;color:white;border:none;border-radius:8px;cursor:pointer'>כניסה</button></div></div>`;
        }
    } catch (e) { console.error(e); }
}

function checkLogin() {
    if (document.getElementById('pass').value === currentPassword) {
        sessionStorage.setItem('isLoggedIn', 'true');
        location.reload();
    } else { alert("טעות!"); }
}

function showMainScreen() {
    document.getElementById('side-menu').style.display = 'flex';
    document.getElementById('main-content').style.display = 'flex';
    render();
}

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

        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; padding:15px 0; border-bottom:1px solid #f1f3f4;">
                <div>
                    <div style="font-weight:600">${t[1] || "ללא תיאור"}</div>
                    <small style="color:#718096">${t[0] ? new Date(t[0]).toLocaleDateString('he-IL') : ""}</small>
                </div>
                <div style="font-weight:bold; color:${amt >= 0 ? '#34a853' : '#ea4335'}">${amt >= 0 ? '+' : '-'}${Math.abs(amt).toLocaleString()} ₪</div>
            </div>`;
    });
    totalEl.innerText = total.toLocaleString() + " ₪";
}

function openModal(type) {
    const modal = document.getElementById('action-modal');
    document.getElementById('modal-title').innerText = type === 'plus' ? 'הוספת סכום' : 'הורדת סכום';
    document.getElementById('modal-body').innerHTML = `
        <input type="number" id="modal-amount" placeholder="סכום (₪)" style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ccc; border-radius:8px; box-sizing:border-box;">
        <input type="text" id="modal-desc" placeholder="תיאור" style="width:100%; padding:12px; border:1px solid #ccc; border-radius:8px; box-sizing:border-box;">`;
    document.getElementById('modal-confirm-btn').className = type === 'plus' ? 'btn-plus' : 'btn-minus';
    document.getElementById('modal-confirm-btn').onclick = () => submitAction(type);
    modal.style.display = 'flex';
}

function closeModal() { document.getElementById('action-modal').style.display = 'none'; }

async function submitAction(type) {
    const amt = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    if (!amt) return;
    closeModal();
    let finalAmt = type === 'plus' ? parseFloat(amt) : -parseFloat(amt);
    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "add", amount: finalAmt, desc: desc }) });
    setTimeout(() => location.reload(), 1000);
}

function logout() { sessionStorage.removeItem('isLoggedIn'); location.reload(); }

init();
