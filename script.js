const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let transactions = [];
let appPassword = ""; // משתנה לשמירת הסיסמה שמגיעה מהשרת

// פונקציית האתחול - מביאה נתונים ומציגה את מסך הכניסה
async function init() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        appPassword = data.password || ""; // שמירת הסיסמה מהגליליון
        
        render();
        
        // הצגת מסך ההתחברות אחרי שהנתונים נטענו
        document.getElementById('auth-screen').style.display = 'flex';
    } catch (e) { 
        console.error("Error init", e); 
        alert("שגיאה בטעינת נתונים, רענן את העמוד.");
    }
}

// פונקציית התחברות שמבטלת את המסך הלבן!
function handleAuth() {
    const passInput = document.getElementById('password-input').value;
    
    // בודק אם הסיסמה תואמת למה שמוגדר בגוגל שיטס בגיליון Settings
    if (passInput === appPassword && appPassword !== "") {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('side-menu').style.display = 'flex';
        document.getElementById('main-content').style.display = 'flex';
    } else {
        alert("סיסמה שגויה, נסה שוב.");
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

    // חישוב מדויק של היתרה (תוך תיקון טעויות עבר מהגיליון)
    transactions.forEach(t => {
        let rawInc = parseFloat(t[2]) || 0;
        let rawExp = parseFloat(t[3]) || 0;
        
        if (rawInc < 0) {
            rawExp += Math.abs(rawInc);
            rawInc = 0;
        }
        
        total += (rawInc - rawExp);
    });

    // מיון לתצוגה: הכי חדש למעלה לפי תאריך
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

    // הצגת יתרה סופית
    totalEl.innerText = total.toLocaleString() + " ₪";
}

// פונקציה להורדה לאקסל / CSV
function exportToExcel() {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // הוספת BOM כדי שהעברית תעבוד באקסל
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

// שליחת נתונים
async function submitAction(type) {
    const amtInput = document.getElementById('modal-amount').value;
    const desc = document.getElementById('modal-desc').value || "ללא תיאור";
    
    let amt = Math.abs(parseFloat(amtInput));
    if (isNaN(amt) || amt === 0) return;

    closeModal();
    
    // שליחה לגוגל סקריפט: אנחנו שולחים גם את ה"סוג" (plus/minus) כדי שיסדר בעמודות
    fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "add", type: type, amount: amt, desc: desc }) 
    });
    
    // עדכון זמני נכון בתצוגה לפני הרענון מגוגל (סידור לעמודה C או D באופן מקומי)
    const now = new Date().toISOString();
    if (type === 'plus') {
        transactions.push([now, desc, amt, ""]);
    } else {
        transactions.push([now, desc, "", amt]);
    }
    render();
    
    setTimeout(refreshData, 2000);
}

async function refreshData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        transactions = data.transactions || [];
        render();
    } catch (e) { console.error("Error refresh", e); }
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

// הפעלת האתר
init();
