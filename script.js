const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let transactions = [];
let appPassword = "";

// פונקציה ליצירת חלון קופץ מעוצב (מחליף את ה-alert הרגיל)
function showCustomAlert(title, message) {
    // אם כבר יש חלון פתוח, נמחק אותו קודם
    let existingAlert = document.getElementById('custom-alert-box');
    if (existingAlert) existingAlert.remove();

    const alertHTML = `
        <div id="custom-alert-box" class="overlay" style="display: flex;">
            <div class="modal" style="text-align: center;">
                <h2 style="color: #dc3545; margin-top: 0;">${title}</h2>
                <p style="font-size: 16px; margin-bottom: 20px; color: #333;">${message}</p>
                <button class="btn-secondary" style="width: 100%;" onclick="document.getElementById('custom-alert-box').remove()">הבנתי וסגור</button>
            </div>
        </div>
    `;
    // הזרקת החלון המעוצב לתוך העמוד
    document.body.insertAdjacentHTML('beforeend', alertHTML);
}

// פונקציית האתחול - מביאה נתונים ומציגה את מסך הכניסה
async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        appPassword = data.password || ""; 
        
        render();
        document.getElementById('auth-screen').style.display = 'flex';
    } catch (e) { 
        console.error("Error init", e); 
        showCustomAlert("שגיאת תקשורת", "יש בעיה בטעינת הנתונים, אנא רענן את העמוד.");
    }
}

// פונקציית התחברות עם בדיקת סיסמה מתוקנת!
function handleAuth() {
    const passInput = document.getElementById('password-input').value.trim();
    
    // ממירים את הסיסמה מגוגל לטקסט וחותכים רווחים כדי למנוע שגיאות סוג
    const correctPassword = String(appPassword).trim();

    if (passInput === correctPassword && correctPassword !== "") {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('side-menu').style.display = 'flex';
        document.getElementById('main-content').style.display = 'flex';
    } else {
        // קריאה לחלון המעוצב שלנו במקום alert של כרום
        showCustomAlert("שגיאה", "הסיסמה שהזנת שגויה, נסה שוב.");
    }
}

// פונקציית התנתקות
function logout() {
    document.getElementById('password-input').value = "";
    document.getElementById('side-menu').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
}

// פונקציית רינדור התצוגה והיתרה
function render() {
    const list = document.getElementById('transactions-list');
    const totalEl = document.getElementById('total-balance');
    if (!list || !totalEl) return;
    
    let total = 0;
    list.innerHTML = "";

    transactions.forEach(t => {
        let rawInc = parseFloat(t[2]) || 0;
        let rawExp = parseFloat(t[3]) || 0;
        
        if (rawInc < 0) {
            rawExp += Math.abs(rawInc);
            rawInc = 0;
        }
        
        total += (rawInc - rawExp);
    });

    const sortedData = [...transactions].sort((a, b) => new Date(b[0]) - new Date(a[0]));

    sortedData.forEach(t => {
        let rawInc = parseFloat(t[2]) || 0;
        let rawExp = parseFloat(t[3]) || 0;
        
        if (rawInc < 0) {
            rawExp += Math.abs(rawInc);
            rawInc = 0;
        }

        if (rawInc === 0 && rawExp === 0) return;

        const dateStr = t[0] ? new Date(t[0]).toLocaleString('he-IL', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : "---";

        let amtStr, colorClass;

        if (rawInc > 0) {
            amtStr = `+ ${rawInc.toLocaleString()} ₪`;
            colorClass = "amount-pos";
        } else {
            amtStr = `- ${rawExp.toLocaleString()} ₪`;
            colorClass = "amount-neg";
        }

        list.innerHTML += `
            <div class="item">
                <div style="text-align: right;">
                    <div style="font-weight:600; font-size: 1.1rem; color: #2d3436;">${t[1] || "ללא תיאור"}</div>
                    <small style="color:gray">${dateStr}</small>
                </div>
                <div class="${colorClass}" style="font-size: 1.2rem; word-break: break-all;">${amtStr}</div>
            </div>`;
    });

    totalEl.innerText = total.toLocaleString() + " ₪";
}

function exportToExcel() {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "תאריך,תיאור,הכנסה,הוצאה\n";
    
    transactions.forEach(t => {
        let date = t[0] ? new Date(t[0]).toLocaleString('he-IL') : "";
        let desc = t[1] || "";
        let inc = t[2] || "";
        let exp = t[3] || "";
        csvContent += `${date},${desc},${inc},${exp}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ניהול_כספים.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function submitAction(type) {
    const amtInput = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    
    let amt = Math.abs(parseFloat(amtInput));
    if (isNaN(amt) || amt === 0) {
        showCustomAlert("שגיאה בהזנה", "חובה להזין סכום תקין הגדול מ-0.");
        return;
    }

    closeModal();
    
    fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "add", type: type, amount: amt, desc: desc }) 
    });
    
    const now = new Date().to
