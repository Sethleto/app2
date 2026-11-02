const initialDebts = [
    { id: "c1", type: "debt", name: "1. Mission Lane Black", start: 1410, bal: 1410, apr: "33.99%", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "c2", type: "debt", name: "2. Mission Lane Regular", start: 2520, bal: 2520, apr: "28.74%", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "c3", type: "debt", name: "3. Ollo Card", start: 1460, bal: 1460, apr: "27.24%", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "c4", type: "debt", name: "4. Happen Bank Loan", start: 1720, bal: 1720, apr: "25.49%", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "c5", type: "debt", name: "5. OneMain Financial", start: 7626, bal: 7626, apr: "24.49%", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "c6", type: "debt", name: "6. Affirm Financing", start: 777, bal: 777, apr: "Fixed Fee", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "c7", type: "debt", name: "7. PayPal Credit", start: 1580, bal: 1580, apr: "Closed", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "c8", type: "debt", name: "8. Capital One", start: 3138, bal: 3138, apr: "0% Promo", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] }
];

const initialAssets = [
    { id: "a1", type: "asset", name: "High-Yield Savings", start: 10000, bal: 0, apr: "Cash Reserves", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "a2", type: "asset", name: "Robinhood Portfolio", start: 25000, bal: 0, apr: "Market Capital", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "a3", type: "asset", name: "Primary 401(k)", start: 50000, bal: 0, apr: "Retirement Active", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "a4", type: "asset", name: "Secondary 401(k)", start: 20000, bal: 0, apr: "Retirement Stable", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] },
    { id: "a5", type: "asset", name: "Health Savings (HSA)", start: 15000, bal: 0, apr: "Medical Capital", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] }
];

const initialFlows = [
    { id: "f1", type: "flow", name: "Family Financial Aid", start: 12000, bal: 0, apr: "$1,000 Monthly Goal", autoFreq: "none", autoDay: 1, autoAmt: 0, history: [] }
];

let debts = JSON.parse(localStorage.getItem('v6_debts')) || initialDebts;
let assets = JSON.parse(localStorage.getItem('v6_assets')) || initialAssets;
let flows = JSON.parse(localStorage.getItem('v6_flows')) || initialFlows;
let activeId = null, activeType = null;

// Background execution logic block to sweep and log automation entries
function checkAndRunAutomations() {
    const today = new Date();
    const currentMonthYear = today.getMonth() + "-" + today.getFullYear();
    
    // Compute current week timestamp sequence to track weekly frequencies cleanly
    const oneJan = new Date(today.getFullYear(), 0, 1);
    const currentWeekIdx = Math.ceil((((today - oneJan) / 86400000) + oneJan.getDay() + 1) / 7) + "-" + today.getFullYear();
    
    let stateMutated = false;
    const allItems = [...debts, ...assets, ...flows];

    allItems.forEach(item => {
        if (!item.autoFreq || item.autoFreq === "none" || item.autoAmt <= 0) return;

        let shouldTrigger = false;
        let cycleKey = "";

        if (item.autoFreq === "monthly") {
            cycleKey = "monthly_" + currentMonthYear;
            if (today.getDate() == item.autoDay) {
                shouldTrigger = true;
            }
        } else if (item.autoFreq === "weekly") {
            cycleKey = "weekly_" + currentWeekIdx;
            if (today.getDay() == item.autoDay) {
                shouldTrigger = true;
            }
        }

        if (shouldTrigger) {
            const alreadyProcessed = item.history.some(h => h.cycleToken === cycleKey);
            if (!alreadyProcessed) {
                if (item.type === "debt") {
                    item.bal = Math.max(0, item.bal - item.autoAmt);
                } else {
                    item.bal += item.autoAmt; // Assets/Flows scale up natively
                }

                item.history.unshift({
                    id: "auto_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
                    date: today.toISOString().split('T')[0],
                    amt: item.autoAmt,
                    type: "Auto",
                    cycleToken: cycleKey
                });
                stateMutated = true;
            }
        }
    });

    if (stateMutated) renderGrid();
}

function renderGrid() {
    let totalAssets = 0, totalDebts = 0, totalStartDebt = 0, totalStartSavings = 0, totalFamily = 0, totalStartFamily = 0;

    const dBox = document.getElementById('debts-box'); dBox.innerHTML = '';
    debts.forEach(d => {
        totalDebts += d.bal; totalStartDebt += d.start;
        const pct = d.start > 0 ? Math.round((d.bal / d.start) * 100) : 0;
        const card = document.createElement('div');
        card.className = `card-container ${d.bal <= 0 ? 'wiped' : ''}`;
        card.onclick = () => openModal(d.id, "debt");
        card.innerHTML = `<div class="card-header"><span>${d.name} ${d.autoAmt > 0 && d.bal > 0 ? '<span class="badge">🤖 AUTO</span>' : ''}</span><span style="color:#ef4444;">$${Math.round(d.bal).toLocaleString()}</span></div>
                          <div class="card-meta">APR: ${d.apr} ${d.autoAmt > 0 ? `| Auto: $${d.autoAmt}/${d.autoFreq === 'weekly' ? 'wk' : 'mo'}` : ''}</div>
                          <div class="bar-wrapper"><div class="bar-fill" style="width:${d.bal <= 0 ? 0 : pct}%;"></div></div>
                          <div class="bar-labels"><span>Current: $${Math.round(d.bal)}</span><span>Target: $0</span></div>`;
        dBox.appendChild(card);
    });

    const aBox = document.getElementById('assets-box'); aBox.innerHTML = '';
    assets.forEach(a => {
        totalAssets += a.bal; totalStartSavings += a.start;
        const pct = a.start > 0 ? Math.round((a.bal / a.start) * 100) : 0;
        const card = document.createElement('div'); card.className = "card-container asset";
        card.onclick = () => openModal(a.id, "asset");
        card.innerHTML = `<div class="card-header"><span>${a.name} ${a.autoAmt > 0 ? '<span class="badge">🤖 AUTO</span>' : ''}</span><span style="color:#0284c7;">$${Math.round(a.bal).toLocaleString()}</span></div>
                          <div class="card-meta">${a.apr} ${a.autoAmt > 0 ? `| Auto: $${a.autoAmt}/${a.autoFreq === 'weekly' ? 'wk' : 'mo'}` : ''}</div>
                          <div class="bar-wrapper"><div class="bar-fill" style="width:${Math.min(pct, 100)}%;"></div></div>
                          <div class="bar-labels"><span>Balance: $${Math.round(a.bal)}</span><span>Milestone: $${a.start}</span></div>`;
        aBox.appendChild(card);
    });

    const fBox = document.getElementById('flows-box'); fBox.innerHTML = '';
    flows.forEach(f => {
        totalFamily += f.bal; totalStartFamily += f.start;
        const pct = f.start > 0 ? Math.round((f.bal / f.start) * 100) : 0;
        const card = document.createElement('div'); card.className = "card-container flow";
        card.onclick = () => openModal(f.id, "flow");
        card.innerHTML = `<div class="card-header"><span>${f.name} ${f.autoAmt > 0 ? '<span class="badge">🤖 AUTO</span>' : ''}</span><span style="color:#a855f7;">$${Math.round(f.bal).toLocaleString()}</span></div>
                          <div class="card-meta">${f.apr} ${f.autoAmt > 0 ? `| Auto: $${f.autoAmt}/${f.autoFreq === 'weekly' ? 'wk' : 'mo'}` : ''}</div>
                          <div class="bar-wrapper"><div class="bar-fill" style="width:${Math.min(pct, 100)}%;"></div></div>
                          <div class="bar-labels"><span>Shared YTD: $${f.bal}</span><span>Limit: $${f.start}</span></div>`;
        fBox.appendChild(card);
    });

    const netWorth = totalAssets - totalDebts;
    const nwDisplay = document.getElementById('nw-display');
    nwDisplay.innerText = (netWorth >= 0 ? "+$" : "-$") + Math.abs(netWorth).toLocaleString();
    nwDisplay.style.color = netWorth >= 0 ? "#10b981" : "#ef4444";

    document.getElementById('savings-display').innerText = "$" + totalAssets.toLocaleString();
    document.getElementById('savings-fill').style.width = Math.min(Math.round((totalAssets / totalStartSavings) * 100), 100) + "%";

    const clearedDebtVal = totalStartDebt - totalDebts;
    document.getElementById('debt-display').innerText = "$" + totalDebts.toLocaleString();
    document.getElementById('debt-fill').style.width = Math.min(Math.round((clearedDebtVal / totalStartDebt) * 100), 100) + "%";

    document.getElementById('family-display').innerText = "$" + totalFamily.toLocaleString();
    document.getElementById('family-fill').style.width = Math.min(Math.round((totalFamily / totalStartFamily) * 100), 100) + "%";

    localStorage.setItem('v6_debts', JSON.stringify(debts));
    localStorage.setItem('v6_assets', JSON.stringify(assets));
    localStorage.setItem('v6_flows', JSON.stringify(flows));
}

function adjustFrequencyLabels() {
    const freq = document.getElementById('auto-frequency').value;
    const wrapper = document.getElementById('auto-day-wrapper');
    const label = document.getElementById('auto-day-label');
    const selector = document.getElementById('auto-trigger-day');
    
    selector.innerHTML = '';
    if (freq === 'none') {
        wrapper.style.display = 'none';
        return;
    }
    wrapper.style.display = 'block';

    if (freq === 'weekly') {
        label.innerText = "Select Weekday Trigger";
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        days.forEach((d, idx) => {
            selector.innerHTML += `<option value="${idx}">${d}</option>`;
        });
    } else if (freq === 'monthly') {
        label.innerText = "Select Calendar Due Day";
        for (let i = 1; i <= 28; i++) {
selector.innerHTML += <option value="${i}">Day ${i}</option>;
}
}
}
function openModal(id, type) {
activeId = id; activeType = type;
let d = type === "debt" ? debts.find(x=>x.id===id) : type === "asset" ? assets.find(x=>x.id===id) : flows.find(x=>x.id===id);
document.getElementById('m-title').innerText = d.name;
document.getElementById('entry-amount').value = '';
document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
document.getElementById('auto-frequency').value = d.autoFreq || "none";
adjustFrequencyLabels();
if (d.autoFreq && d.autoFreq !== "none") {
document.getElementById('auto-trigger-day').value = d.autoDay || 1;
}
document.getElementById('auto-amount').value = d.autoAmt || 0;
if (type === "debt") {
document.getElementById('input-label').innerText = "Log Manual Avalanche Payment (- $)";
} else {
document.getElementById('input-label').innerText = "Log Manual Balance Reset ($)";
}
const hList = document.getElementById('history-list'); hList.innerHTML = '';
if (d.history.length === 0) hList.innerHTML = 'No logs registered.';
d.history.forEach(h => {
hList.innerHTML += <div class="history-item"><span>${h.date} (${h.type || 'Manual'})</span><span>$${h.amt.toLocaleString()} <button class="del-btn" onclick="deleteItem(event, '${h.id}')">&times;</button></span></div>;
});
document.getElementById('modal').style.display = 'flex';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; }
function deleteItem(e, hid) {
e.stopPropagation();
let d = activeType === "debt" ? debts.find(x=>x.id===activeId) : activeType === "asset" ? assets.find(x=>x.id===activeId) : flows.find(x=>x.id===activeId);
const idx = d.history.findIndex(h => h.id === hid);
if(idx > -1) {
if (activeType === "debt") d.bal += d.history[idx].amt;
d.history.splice(idx, 1);
renderGrid(); closeModal();
}
}
function submitEntry() {
const amt = parseFloat(document.getElementById('entry-amount').value);
const date = document.getElementById('entry-date').value;
const freq = document.getElementById('auto-frequency').value;
const trigDay = parseInt(document.getElementById('auto-trigger-day').value) || 1;
const autoAmt = parseFloat(document.getElementById('auto-amount').value) || 0;
let d = activeType === "debt" ? debts.find(x=>x.id===activeId) : activeType === "asset" ? assets.find(x=>x.id===activeId) : flows.find(x=>x.id===activeId);
// Save automation variables
d.autoFreq = freq;
d.autoDay = trigDay;
d.autoAmt = autoAmt;
// Run manual overrides
if (amt >= 0 && date) {
if (activeType === "debt") {
d.bal = Math.max(0, d.bal - amt);
} else {
d.bal = amt; // Balance overwrite
}
d.history.unshift({ id: "man_" + Date.now(), date, amt, type: "Manual" });
}
renderGrid(); closeModal();
checkAndRunAutomations(); // Immediate verification check
}
// Boot scripts
checkAndRunAutomations();
renderGrid();
setInterval(checkAndRunAutomations, 3600000); // Check loop hour pulse
