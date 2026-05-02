const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let transactions = [];

async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        render();
    } catch (e) { console.error("Error", e); }
}

async function refreshData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        render();
    } catch (e) { console.error("Refresh Error", e); }
}

function render() {
    const list = document.getElementById('transactions-list');
    const totalEl = document.getElementById('total-balance');
    let total = 0;
    list.innerHTML = "";

    // מיון: הכי חדש (לפי זמן) מופיע למעלה
    const sortedData = [...transactions].sort((a, b) => new Date(b[0]) - new Date(a[0]));

    sortedData.forEach(t => {
        const inc = parseFloat(t[2]) || 0;
        const exp = parseFloat(t[3]) || 0;
        total += (inc - exp);

        const dateStr = t[0] ? new Date(t[0]).toLocaleString('he-IL', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }) : "";

        let colorClass = inc > 0 ? "amount-pos" : (exp > 0 ? "amount-neg" : "");
        let displayVal = inc > 0 ? `+ ${inc.toLocaleString()} ₪` : (exp > 0 ? `- ${exp.toLocaleString()} ₪` : "0 ₪");

        list.innerHTML += `
            <div class="item">
                <div style="text-align: right;">
                    <div style="font-weight:700; font-size: 1.1rem; color: #202124;">${t[1] || "ללא תיאור"}</div>
                    <small style="color: #5f6368;">${dateStr}</small>
                </div>
                <div class="${colorClass}" style="font-size: 1.2rem;">${displayVal}</div>
            </div>`;
    });
    totalEl.innerText = total.toLocaleString() + " ₪";
}

async function submitAction(type) {
    const amtInput = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    if (!amtInput) return;

    let amt = Math.abs(parseFloat(amtInput));
    if (type === 'minus') amt = -amt;

    closeModal();
    
    // עדכון זמני באתר לשיפור המהירות
    const tempDate = new Date().toISOString();
    transactions.push([tempDate, desc, amt > 0 ? amt : "", amt < 0 ? Math.abs(amt) : ""]);
    render();

    // שליחה שקטה לשרת
    await fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: JSON.stringify({ action: "add", amount: amt, desc: desc }) 
    });

    // רענון נתונים סופי מהשרת
    setTimeout(refreshData, 1500);
}

function exportToExcel() {
    let csv = "\ufeffתאריך,תיאור,הכנסה +,הוצאה -\n";
    transactions.forEach(t => {
        csv += `${new Date(t[0]).toLocaleString('he-IL')},${t[1]},${t[2] || ""},${t[3] || ""}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'דוח_תנועות.csv';
    a.click();
}

init();
