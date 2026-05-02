const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let transactions = [];
let currentPassword = "";

async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        currentPassword = data.password || "";

        if (!currentPassword || sessionStorage.getItem('isLoggedIn') === 'true') {
            showMainScreen();
        } else {
            document.getElementById('auth-screen').style.display = 'flex';
        }
    } catch (e) { console.error("Error init", e); }
}

async function refreshData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        render();
    } catch (e) { console.error("Error refresh", e); }
}

function showMainScreen() {
    document.getElementById('auth-screen').style.display = 'none';
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
        const inc = parseFloat(t[2]) || 0;
        const exp = parseFloat(t[3]) || 0;
        const amt = inc > 0 ? inc : -exp;
        total += amt;

        list.innerHTML += `
            <div class="item">
                <div>
                    <div style="font-weight:600">${t[1] || "ללא תיאור"}</div>
                    <small style="color:gray">${t[0] ? new Date(t[0]).toLocaleDateString('he-IL') : ""}</small>
                </div>
                <div class="${amt >= 0 ? 'amount-pos' : 'amount-neg'}">${amt.toLocaleString()} ₪</div>
            </div>`;
    });
    totalEl.innerText = total.toLocaleString() + " ₪";
}

function openModal(type) {
    const modal = document.getElementById('action-modal');
    document.getElementById('modal-title').innerText = type === 'plus' ? 'הוספת סכום' : 'הורדת סכום';
    document.getElementById('modal-body').innerHTML = `
        <input type="number" id="modal-amount" placeholder="סכום (₪)">
        <input type="text" id="modal-desc" placeholder="תיאור">`;
    document.getElementById('modal-confirm-btn').onclick = () => submitAction(type);
    modal.style.display = 'flex';
}

function closeModal() { document.getElementById('action-modal').style.display = 'none'; }

async function submitAction(type) {
    const amtInput = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    if (!amtInput) return;

    let amt = Math.abs(parseFloat(amtInput));
    if (type === 'minus') amt = -amt;

    closeModal();
    // שליחה שקטה
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "add", amount: amt, desc: desc }) });
    
    // עדכון מקומי זמני כדי שתראה את השינוי מיד בלי לחכות לשרת
    transactions.push([new Date().toISOString(), desc, amt > 0 ? amt : "", amt < 0 ? Math.abs(amt) : ""]);
    render();
    
    // רענון אמיתי מהשרת אחרי 2 שניות
    setTimeout(refreshData, 2000);
}

function handleAuth() {
    if (document.getElementById('password-input').value === currentPassword) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showMainScreen();
    } else { alert("טעות!"); }
}

function exportToExcel() {
    let csv = "\ufeffתאריך,תיאור,הכנסה,הוצאה\n";
    transactions.forEach(t => {
        csv += `${t[0] ? new Date(t[0]).toLocaleDateString('he-IL') : ""},${t[1]},${t[2]},${t[3]}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'דוח_כספי.csv';
    a.click();
}

init();
