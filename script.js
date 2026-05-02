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
            document.getElementById('auth-screen').style.display = 'flex';
        }
    } catch (e) {
        console.error("שגיאה בחיבור:", e);
    }
}

async function refreshData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        render(); 
    } catch (e) {
        console.error("שגיאה ברענון:", e);
    }
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
        const income = parseFloat(t[2]) || 0;
        const expense = parseFloat(t[3]) || 0;
        const amt = income > 0 ? income : -expense;
        total += amt;

        const date = t[0] ? new Date(t[0]).toLocaleDateString('he-IL') : "---";
        // עיצוב טקסט מנוגד וברור ללא מסגרת
        list.innerHTML += `
            <div style="display: flex; justify-content: space-between; padding: 20px 0; border-bottom: 1px solid rgba(0,0,0,0.05); color: #202124;">
                <div>
                    <div style="font-weight: 600; font-size: 1.1rem;">${t[1] || "ללא תיאור"}</div>
                    <small style="color: #5f6368;">${date}</small>
                </div>
                <div style="font-weight: bold; font-size: 1.2rem; color: ${amt >= 0 ? '#34a853' : '#ea4335'};">
                    ${amt >= 0 ? '+' : '-'}${Math.abs(amt).toLocaleString()} ₪
                </div>
            </div>`;
    });
    totalEl.innerText = total.toLocaleString() + " ₪";
}

async function submitAction(type) {
    const amtInput = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    if (!amtInput) return;

    let amount = Math.abs(parseFloat(amtInput));
    if (type === 'minus') amount = -amount;

    closeModal();
    
    try {
        await fetch(SCRIPT_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            body: JSON.stringify({ action: "add", amount: amount, desc: desc }) 
        });
        // עדכון הנתונים באתר ללא רענון דף
        setTimeout(refreshData, 1000);
    } catch (e) {
        console.error("שגיאה בשמירה:", e);
    }
}

function openModal(type) {
    const modal = document.getElementById('action-modal');
    document.getElementById('modal-title').innerText = type === 'plus' ? 'הוספת סכום' : 'הורדת סכום';
    document.getElementById('modal-body').innerHTML = `
        <input type="number" id="modal-amount" placeholder="סכום (₪)" style="width: 100%; padding: 12px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 8px;">
        <input type="text" id="modal-desc" placeholder="תיאור" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px;">
    `;
    document.getElementById('modal-confirm-btn').onclick = () => submitAction(type);
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('action-modal').style.display = 'none';
}

function handleAuth() {
    const input = document.getElementById('password-input').value;
    if (input === currentPassword) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showMainScreen();
    } else {
        alert("סיסמה שגויה!");
    }
}

init();
