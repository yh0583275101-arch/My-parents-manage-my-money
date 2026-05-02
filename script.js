const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let transactions = [];

async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        render();
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

function render() {
    const list = document.getElementById('transactions-list');
    const totalEl = document.getElementById('total-balance');
    if (!list || !totalEl) return;
    
    let total = 0;
    list.innerHTML = "";

    // חישוב היתרה לפי הסדר המקורי (מלמעלה למטה בגיליון)
    transactions.forEach(t => {
        const inc = parseFloat(t[2]) || 0;
        const exp = parseFloat(t[3]) || 0;
        total += (inc - exp);
    });

    // מיון לתצוגה: הכי חדש למעלה
    const sortedData = [...transactions].sort((a, b) => new Date(b[0]) - new Date(a[0]));

    sortedData.forEach(t => {
        const inc = parseFloat(t[2]) || 0;
        const exp = parseFloat(t[3]) || 0;
        const amt = inc > 0 ? inc : -exp;

        if (inc === 0 && exp === 0) return; // דילוג על שורות ריקות

        const dateStr = t[0] ? new Date(t[0]).toLocaleString('he-IL', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : "---";

        let amtStr = inc > 0 ? `+ ${inc.toLocaleString()} ₪` : `- ${exp.toLocaleString()} ₪`;
        let colorClass = inc > 0 ? "amount-pos" : "amount-neg";

        list.innerHTML += `
            <div class="item">
                <div style="text-align: right;">
                    <div style="font-weight:600; font-size: 1.1rem; color: #2d3436;">${t[1] || "ללא תיאור"}</div>
                    <small style="color:gray">${dateStr}</small>
                </div>
                <div class="${colorClass}" style="font-size: 1.2rem; word-break: break-all;">${amtStr}</div>
            </div>`;
    });

    // הצגת יתרה סופית (מוגבל לפורמט קריא)
    totalEl.innerText = total.toLocaleString() + " ₪";
}

async function submitAction(type) {
    const amtInput = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    
    // מניעת הכנסת מינוס ידני - האפליקציה מחליטה לפי סוג הכפתור
    let amt = Math.abs(parseFloat(amtInput));
    if (isNaN(amt) || amt === 0) return;
    if (type === 'minus') amt = -amt;

    closeModal();
    
    // שליחה שקטה
    fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: JSON.stringify({ action: "add", amount: amt, desc: desc }) 
    });
    
    // עדכון זמני בתצוגה
    const now = new Date().toISOString();
    transactions.push([now, desc, amt > 0 ? amt : "", amt < 0 ? Math.abs(amt) : ""]);
    render();
    
    setTimeout(refreshData, 2000);
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
// שאר הפונקציות (init, exportToExcel וכו') ללא שינוי
init();
