const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7ppdE1OnRe29xVnw6RBIIQB8Dj2nUcuGTJBss9joEcpnl7t0CCCH2VG4ryNnARR3h/exec";
let currentPassword = "";
let transactions = [];

async function init() {
    // מציגים מסך טעינה לבן כדי שלא יהיו קפיצות
    document.getElementById('auth-screen').style.display = 'none'; 
    
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        currentPassword = data.password;
        transactions = data.transactions;

        if (!currentPassword || sessionStorage.getItem('isLoggedIn') === 'true') {
            showMainScreen();
        } else {
            // רק אם באמת יש סיסמה בשיטס, מציגים את מסך הנעילה
            document.getElementById('auth-screen').style.display = 'flex';
        }
    } catch (e) {
        console.error("שגיאה בחיבור לגוגל", e);
    }
}

function showMainScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'flex';
    document.getElementById('side-menu').style.display = 'flex';
    render();
}

function openModal(type) {
    const modal = document.getElementById('action-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const btn = document.getElementById('modal-confirm-btn');
    
    document.getElementById('main-wrapper').classList.add('blur');
    modal.style.display = 'flex';

    if (type === 'plus' || type === 'minus') {
        title.innerText = type === 'plus' ? 'הוספת סכום' : 'הורדת סכום';
        body.innerHTML = `
            <input type="number" id="modal-amount" placeholder="סכום (₪)">
            <input type="text" id="modal-desc" placeholder="תיאור">
        `;
        btn.onclick = () => submitAction(type);
        btn.className = type === 'plus' ? 'btn-plus' : 'btn-minus';
        btn.style.background = ""; // איפוס צבע
    } else if (type === 'password') {
        title.innerText = currentPassword ? "שינוי סיסמה" : "הגדרת סיסמה";
        body.innerHTML = `
            ${currentPassword ? '<input type="password" id="old-p" placeholder="סיסמה נוכחית">' : ''}
            <input type="password" id="new-p" placeholder="סיסמה חדשה">
        `;
        btn.onclick = updatePassword;
        btn.className = 'btn-plus'; // כאן אנחנו מוודאים שהכפתור יהיה צבעוני ולא אפור
        btn.style.background = "linear-gradient(to right, #0077be, #00a8cc)"; 
    }
}

// שאר הפונקציות (render, handleAuth, updatePassword) נשארות כפי שהיו
