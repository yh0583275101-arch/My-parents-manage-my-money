const SCRIPT_URL = "כאן_הכנס_את_הקישור_החדש_שלך";
let transactions = [];

async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        showMainScreen();
    } catch (e) { console.error("Connection error", e); }
}

function showMainScreen() {
    document.getElementById('side-menu').style.display = 'flex';
    document.getElementById('main-content').style.display = 'flex';
    render();
}

// פונקציה לעדכון ללא רענון דף
async function silentRefresh() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        render(); 
    } catch (e) { console.error("Refresh error", e); }
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
            <div style="display:flex; justify-content:space-between; padding:15px 0; border-bottom:1px solid #eee;">
                <div>
                    <div style="font-weight:600">${t[1] || "ללא תיאור"}</div>
                    <small style="color:#777">${t[0] ? new Date(t[0]).toLocaleDateString('he-IL') : ""}</small>
                </div>
                <div style="font-weight:bold; color:${amt >= 0 ? 'green' : 'red'}">
                    ${amt.toLocaleString()} ₪
                </div>
            </div>`;
    });
    totalEl.innerText = total.toLocaleString() + " ₪";
}

async function submitAction(type) {
    const amt = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    if (!amt) return;

    closeModal();
    let finalAmt = type === 'plus' ? parseFloat(amt) : -parseFloat(amt);

    // שליחה לשרת
    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: "add", amount: finalAmt, desc: desc })
    });

    // עדכון התצוגה מיד ללא רענון דף
    setTimeout(silentRefresh, 1000);
}

// שאר הפונקציות (openModal, closeModal וכו') נשארות כפי שהיו
