const SCRIPT_URL = "כאן_להדביק_את_הכתובת_שלך"; // הכתובת שקיבלת מגוגל
let currentPassword = "";
let transactions = [];

async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        currentPassword = data.password;
        transactions = data.transactions;
        if (!currentPassword) {
            document.getElementById('auth-title').innerText = "קביעת סיסמה ראשונית";
        }
    } catch (e) { console.error("Error loading data", e); }
}

async function handleAuth() {
    const input = document.getElementById('password-input').value;
    if (!currentPassword) {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "setPassword", newPass: input })
        });
        alert("הסיסמה נקבעה! נא לרענן את הדף.");
        location.reload();
    } else if (input === currentPassword) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-screen').style.display = 'block';
        render();
    } else {
        document.getElementById('error-msg').innerText = "סיסמה שגויה!";
    }
}

function render() {
    const list = document.getElementById('transactions-list');
    const totalEl = document.getElementById('total-balance');
    let total = 0;
    list.innerHTML = "";

    [...transactions].reverse().forEach(t => {
        const amt = parseFloat(t[2]);
        total += amt;
        list.innerHTML += `
            <div class="item">
                <span><strong>${new Date(t[0]).toLocaleDateString()}</strong> - ${t[1]}</span>
                <span class="${amt >= 0 ? 'pos' : 'neg'}">${amt} ₪</span>
            </div>`;
    });
    totalEl.innerText = total + " ₪";
}

async function submitTransaction(type) {
    const amount = document.getElementById('amount').value;
    const desc = document.getElementById('description').value || "ללא תיאור";
    if (!amount) return alert("נא להזין סכום");

    const finalAmount = type === 'plus' ? amount : -amount;
    document.body.style.opacity = "0.5"; // חיווי טעינה

    await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "add", amount: finalAmount, desc: desc })
    });

    location.reload();
}

function exportToExcel() {
    let csv = "\ufeffתאריך,תיאור,הכנסה,הוצאה\n";
    transactions.forEach(t => {
        const amt = parseFloat(t[2]);
        csv += `${new Date(t[0]).toLocaleDateString()},${t[1]},${amt > 0 ? amt : ""},${amt < 0 ? Math.abs(amt) : ""}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "דוח_תקציב.csv";
    link.click();
}

async function resetPasswordAction() {
    const old = prompt("הזן סיסמה נוכחית:");
    if (old !== currentPassword) return alert("סיסמה שגויה");
    const next = prompt("הזן סיסמה חדשה:");
    if (next) {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "setPassword", newPass: next })
        });
        alert("הסיסמה שונתה בהצלחה!");
        location.reload();
    }
}

init();
