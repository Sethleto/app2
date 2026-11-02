const initialDebts = [
    { id: "c1", type: "debt", name: "1. Mission Lane Black", start: 1410, bal: 1410, apr: "33.99%", pay: 1182.33, dueDay: 5, history: [] },
    { id: "c2", type: "debt", name: "2. Mission Lane Regular", start: 2520, bal: 2520, apr: "28.74%", pay: 87.00, dueDay: 12, history: [] },
    { id: "c3", type: "debt", name: "3. Ollo Card", start: 1460, bal: 1460, apr: "27.24%", pay: 34.00, dueDay: 15, history: [] },
    { id: "c4", type: "debt", name: "4. Happen Bank Loan", start: 1720, bal: 1720, apr: "25.49%", pay: 252.00, dueDay: 18, history: [] },
    { id: "c5", type: "debt", name: "5. OneMain Financial", start: 7626, bal: 7626, apr: "24.49%", pay: 246.00, dueDay: 22, history: [] },
    { id: "c6", type: "debt", name: "6. Affirm Financing", start: 777, bal: 777, apr: "Fixed", pay: 260.00, dueDay: 1, history: [] },
    { id: "c7", type: "debt", name: "7. PayPal Credit", start: 1580, bal: 1580, apr: "Closed", pay: 30.00, dueDay: 25, history: [] },
    { id: "c8", type: "debt", name: "8. Capital One", start: 3138, bal: 3138, apr: "0% Promo", pay: 32.00, dueDay: 28, history: [] }
];

const initialAssets = [
    { id: "a1", type: "asset", name: "High-Yield Savings", start: 10000, bal: 0, apr: "Cash", pay: 0, dueDay: 0, history: [] },
    { id: "a2", type: "asset", name: "Robinhood Portfolio", start: 25000, bal: 0, apr: "Stocks/Crypto", pay: 0, dueDay: 0, history: [] },
    { id: "a3", type: "asset", name: "Primary 401(k)", start: 50000, bal: 0, apr: "Pre-Tax Retirement", pay: 0, dueDay: 0, history: [] },
    { id: "a4", type: "asset", name: "Secondary 401(k)", start: 20000, bal: 0, apr: "Past Corporate Asset", pay: 0, dueDay: 0, history: [] },
    { id: "a5", type: "asset", name: "Health Savings (HSA)", start: 50000, bal: 0, apr: "Medical Wealth", pay: 0, dueDay: 0, history: [] }
];

const initialFlows = [
    { id: "f1", type: "flow", name: "Family Financial Aid", start: 12000, bal: 0, apr: "$1,000/mo Aid", pay: 1000, dueDay: 1, history: [] }
];

let debts = JSON.parse(localStorage.getItem('grid_debts')) || initialDebts;
let assets = JSON.parse(localStorage.getItem('grid_assets')) || initialAssets;
let flows = JSON.parse(localStorage.getItem('grid_flows')) || initialFlows;
let activeId = null, activeType = null;

function checkAutoPayments() {
    const today = new Date();
    const currentDay = today.getDate();
    let updated = false;

    debts.forEach(d => {
        if (d.bal > 0 && d.dueDay === currentDay) {
            const currentMonthYear = today.getMonth() + "-" + today.getFullYear();
            const alreadyPaidThisMonth = d.history.some(h => h.monthYear === currentMonthYear && h.type === "Auto");
            
            if (!alreadyPaidThisMonth) {
                const actualPay = Math.min(d.pay, d.bal);
                d.bal = Math.max(0, d.bal - actualPay);
                d.history.unshift({
                    id: Date.now().toString(),
                    date: today.toISOString().split('T')[0],
                    amt: actualPay,
                    monthYear: currentMonthYear,
                    type: "Auto"
                });
                updated = true;
            }
        }
    });

    if (updated) renderGrid();
}

function renderGrid() {
    let totalAssets = 0, totalDebts = 0;
    
    const dBox = document.getElementById('debts-box'); dBox.innerHTML = '';
    debts.forEach(d => {
        totalDebts += d.bal;
        const pct = d.start > 0 ? Math.round((d.bal / d.start) * 100) : 0;
        const card = document.createElement('div');
        card.className = `card-container ${d.bal <= 0 ? 'wiped' : ''}`;
        card.onclick = () => openModal(d.id, "debt");
        card.innerHTML = `<div class="card-header"><span>${d.name}</span><span style="color:#ef4444;">$${Math.round(d.bal)}</span></div>
                          <div class="card-meta">APR: ${d.apr} | Due: Day ${d.dueDay}</div>
                          <div class="bar-wrapper"><div class="bar-fill" style="width:${d.bal <= 0 ? 0 : pct}%;"></div></div>`;
        dBox.appendChild(card);
    });

    const aBox = document.getElementById('assets-box'); aBox.innerHTML = '';
    assets.forEach(a => {
        totalAssets += a.bal;
        const pct = a.start > 0 ? Math.round((a.bal / a.start) * 100) : 0;
        const card = document.createElement('div'); card.className = "card-container asset";
        card.onclick = () => openModal(a.id, "asset");
        card.innerHTML = `<div class="card-header"><span>${a.name}</span><span style="color:#0284c7;">$${Math.round(a.bal)}</span></div>
                          <div class="card-meta">${a.apr} | Target: $${a.start}</div>
                          <div class="bar-wrapper"><div class="bar-fill" style="width:${Math.min(pct, 100)}%;"></div></div>`;
        aBox.appendChild(card);
    });

    const fBox = document.getElementById('flows-box'); fBox.innerHTML = '';
    flows.forEach(f => {
        const card = document.createElement('div'); card.className = "card-container flow";
        card.onclick = () => openModal(f.id, "flow");
        card.innerHTML = `<div class="card-header"><span>${f.name}</span><span style="color:#a855f7;">YTD: $${f.bal}</span></div>
                          <div class="card-meta">${f.apr}</div>`;
        fBox.appendChild(card);
    });

    const netWorth = totalAssets - totalDebts;
    const nwDisplay = document.getElementById('nw-display');
    nwDisplay.innerText = (netWorth >= 0 ? "+$" : "-$") + Math.abs(netWorth).toLocaleString();
    nwDisplay.style.color = netWorth >= 0 ? "#10b981" : "#ef4444";

    localStorage.setItem('grid_debts', JSON.stringify(debts));
    localStorage.setItem('grid_assets', JSON.stringify(assets));
    localStorage.setItem('grid_flows', JSON.stringify(flows));
}

function openModal(id, type) {
    activeId = id; activeType = type;
    let d = type === "debt" ? debts.find(x=>x.id===id) : type === "asset" ? assets.find(x=>x.id===id) : flows.find(x=>x.id===id);
    document.getElementById('m-title').innerText = d.name;
    document.getElementById('pay-amount').value = '';
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('due-day-group').style.display = type === "asset" ? 'none' : 'block';
    if(type !== "asset") document.getElementById('pay-due-day').value = d.dueDay;
    
    const hList = document.getElementById('history-list'); hList.innerHTML = '';
    if (d.history.length === 0) {
        hList.innerHTML = '<div style="color:#64748b; padding: 5px 0;">No logs recorded yet.</div>';
    }
    d.history.forEach(h => {
        hList.innerHTML += `<div class="history-item"><span>${h.date}</span><span>$${h.amt} <button class="del-btn" onclick="deleteItem(event, '${h.id}')">&times;</button></span></div>`;
    });
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

function deleteItem(e, hid) {
    e.stopPropagation();
    let d = activeType === "debt" ? debts.find(x=>x.id===activeId) : activeType === "asset" ? assets.find(x=>x.id===activeId) : flows.find(x=>x.id===activeId);
    const idx = d.history.findIndex(h => h.id === hid);
    if(idx > -1) {
        if(activeType === "debt") d.bal += d.history[idx].amt;
        else d.bal -= d.history[idx].amt;
        d.history.splice(idx, 1);
        renderGrid(); closeModal();
    }
}

function submitForm() {
    const amt = parseFloat(document.getElementById('pay-amount').value);
    const date = document.getElementById('pay-date').value;
    let d = activeType === "debt" ? debts.find(x=>x.id===activeId) : activeType === "asset" ? assets.find(x=>x.id===activeId) : flows.find(x=>x.id===activeId);
    
    if(activeType !== "asset") {
        const nd = parseInt(document.getElementById('pay-due-day').value);
        if(nd >= 1 && nd <= 31) d.dueDay = nd;
    }
    if(amt && amt > 0 && date) {
        if(activeType === "debt") d.bal = Math.max(0, d.bal - amt);
        else d.bal += amt;
        d.history.unshift({ id: Date.now().toString(), date, amt });
    }
    renderGrid(); closeModal();
}

checkAutoPayments();
renderGrid();
setInterval(checkAutoPayments, 3600000);
