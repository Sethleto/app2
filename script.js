const initialDebts = [
    { id: "c1", type: "debt", name: "1. Mission Lane Black", start: 1410, bal: 1410, apr: "33.99%", history: [] },
    { id: "c2", type: "debt", name: "2. Mission Lane Regular", start: 2520, bal: 2520, apr: "28.74%", history: [] },
    { id: "c3", type: "debt", name: "3. Ollo Card", start: 1460, bal: 1460, apr: "27.24%", history: [] },
    { id: "c4", type: "debt", name: "4. Happen Bank Loan", start: 1720, bal: 1720, apr: "25.49%", history: [] },
    { id: "c5", type: "debt", name: "5. OneMain Financial", start: 7626, bal: 7626, apr: "24.49%", history: [] },
    { id: "c6", type: "debt", name: "6. Affirm Financing", start: 777, bal: 777, apr: "Fixed Fee", history: [] },
    { id: "c7", type: "debt", name: "7. PayPal Credit", start: 1580, bal: 1580, apr: "Closed", history: [] },
    { id: "c8", type: "debt", name: "8. Capital One", start: 3138, bal: 3138, apr: "0% Promo", history: [] }
];

const initialAssets = [
    { id: "a1", type: "asset", name: "High-Yield Savings", start: 10000, bal: 0, apr: "Cash Reserves", history: [] },
    { id: "a2", type: "asset", name: "Robinhood Portfolio", start: 25000, bal: 0, apr: "Market Capital", history: [] },
    { id: "a3", type: "asset", name: "Primary 401(k)", start: 50000, bal: 0, apr: "Retirement Active", history: [] },
    { id: "a4", type: "asset", name: "Secondary 401(k)", start: 20000, bal: 0, apr: "Retirement Stable", history: [] },
    { id: "a5", type: "asset", name: "Health Savings (HSA)", start: 15000, bal: 0, apr: "Medical Capital", history: [] }
];

const initialFlows = [
    { id: "f1", type: "flow", name: "Family Financial Aid", start: 12000, bal: 0, apr: "$1,000 Monthly Goal", history: [] }
];

let debts = JSON.parse(localStorage.getItem('m_debts')) || initialDebts;
let assets = JSON.parse(localStorage.getItem('m_assets')) || initialAssets;
let flows = JSON.parse(localStorage.getItem('m_flows')) || initialFlows;
let activeId = null, activeType = null;

function renderGrid() {
    let totalAssets = 0, totalDebts = 0, totalStartDebt = 0, totalStartSavings = 0, totalFamily = 0, totalStartFamily = 0;

    // Render Debts Column
    const dBox = document.getElementById('debts-box'); dBox.innerHTML = '';
    debts.forEach(d => {
        totalDebts += d.bal;
        totalStartDebt += d.start;
        const pct = d.start > 0 ? Math.round((d.bal / d.start) * 100) : 0;
        const card = document.createElement('div');
        card.className = `card-container ${d.bal <= 0 ? 'wiped' : ''}`;
        card.onclick = () => openModal(d.id, "debt");
        card.innerHTML = `<div class="card-header"><span>${d.name}</span><span style="color:#ef4444;">$${d.bal.toLocaleString()}</span></div>
                          <div class="card-meta">APR: ${d.apr}</div>
                          <div class="bar-wrapper"><div class="bar-fill" style="width:${d.bal <= 0 ? 0 : pct}%;"></div></div>
                          <div class="bar-labels"><span>Initial: $${d.start}</span><span>Target: $0</span></div>`;
        dBox.appendChild(card);
    });

    // Render Assets Column
    const aBox = document.getElementById('assets-box'); aBox.innerHTML = '';
    assets.forEach(a => {
        totalAssets += a.bal;
        totalStartSavings += a.start;
        const pct = a.start > 0 ? Math.round((a.bal / a.start) * 100) : 0;
        const card = document.createElement('div'); card.className = "card-container asset";
        card.onclick = () => openModal(a.id, "asset");
        card.innerHTML = `<div class="card-header"><span>${a.name}</span><span style="color:#0284c7;">$${a.bal.toLocaleString()}</span></div>
                          <div class="card-meta">${a.apr}</div>
                          <div class="bar-wrapper"><div class="bar-fill" style="width:${Math.min(pct, 100)}%;"></div></div>
                          <div class="bar-labels"><span>Current: $${a.bal}</span><span>Milestone: $${a.start}</span></div>`;
        aBox.appendChild(card);
    });

    // Render Flows Column
    const fBox = document.getElementById('flows-box'); fBox.innerHTML = '';
    flows.forEach(f => {
        totalFamily += f.bal;
        totalStartFamily += f.start;
        const pct = f.start > 0 ? Math.round((f.bal / f.start) * 100) : 0;
        const card = document.createElement('div'); card.className = "card-container flow";
        card.onclick = () => openModal(f.id, "flow");
        card.innerHTML = `<div class="card-header"><span>${f.name}</span><span style="color:#a855f7;">$${f.bal.toLocaleString()}</span></div>
                          <div class="card-meta">${f.apr}</div>
                          <div class="bar-wrapper"><div class="bar-fill" style="width:${Math.min(pct, 100)}%;"></div></div>
                          <div class="bar-labels"><span>Shared YTD: $${f.bal}</span><span>Limit: $${f.start}</span></div>`;
        fBox.appendChild(card);
    });

    // Compute Global Financial Top Summary Tiers
    const netWorth = totalAssets - totalDebts;
    const nwDisplay = document.getElementById('nw-display');
    nwDisplay.innerText = (netWorth >= 0 ? "+$" : "-$") + Math.abs(netWorth).toLocaleString();
    nwDisplay.style.color = netWorth >= 0 ? "#10b981" : "#ef4444";

    document.getElementById('savings-display').innerText = "$" + totalAssets.toLocaleString();
    const globalSavingsPct = totalStartSavings > 0 ? Math.min(Math.round((totalAssets / totalStartSavings) * 100), 100) : 0;
    document.getElementById('savings-fill').style.width = globalSavingsPct + "%";

    const clearedDebtVal = totalStartDebt - totalDebts;
    const globalDebtPct = totalStartDebt > 0 ? Math.min(Math.round((clearedDebtVal / totalStartDebt) * 100), 100) : 100;
    document.getElementById('debt-display').innerText = "$" + totalDebts.toLocaleString();
    document.getElementById('debt-fill').style.width = globalDebtPct + "%";

    document.getElementById('family-display').innerText = "$" + totalFamily.toLocaleString();
    const globalFamilyPct = totalStartFamily > 0 ? Math.min(Math.round((totalFamily / totalStartFamily) * 100), 100) : 100;
    document.getElementById('family-fill').style.width = globalFamilyPct + "%";

    localStorage.setItem('m_debts', JSON.stringify(debts));
    localStorage.setItem('m_assets', JSON.stringify(assets));
    localStorage.setItem('m_flows', JSON.stringify(flows));
}

function openModal(id, type) {
    activeId = id; activeType = type;
    let d = type === "debt" ? debts.find(x=>x.id===id) : type === "asset" ? assets.find(x=>x.id===id) : flows.find(x=>x.id===id);
    
    document.getElementById('m-title').innerText = d.name;
    document.getElementById('entry-amount').value = '';
    document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
    
    if (type === "debt") {
        document.getElementById('input-label').innerText = "Log Payment Made (- $)";
    } else if (type === "asset") {
        document.getElementById('input-label').innerText = "Adjust Current Total Balance ($)";
    } else {
        document.getElementById('input-label').innerText = "Log Capital Sent Home (+ $)";
    }

    const hList = document.getElementById('history-list'); hList.innerHTML = '';
    if (d.history.length === 0) hList.innerHTML = '<div style="color:#64748b; padding: 5px 0;">No past records logged.</div>';
    
    d.history.forEach(h => {
        hList.innerHTML += `<div class="history-item"><span>${h.date}</span><span>$${h.amt.toLocaleString()} <button class="del-btn" onclick="deleteItem(event, '${h.id}')">&times;</button></span></div>`;
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
        // Asset history logs act as pure total balance resets
        renderGrid(); closeModal();
    }
}

function submitEntry() {
    const amt = parseFloat(document.getElementById('entry-amount').value);
    const date = document.getElementById('entry-date').value;
    let d = activeType === "debt" ? debts.find(x=>x.id===activeId) : activeType === "asset" ? assets.find(x=>x.id===activeId) : flows.find(x=>x.id===activeId);
    
    if(amt >= 0 && date) {
        if(activeType === "debt") {
            d.bal = Math.max(0, d.bal - amt);
            d.history.unshift({ id: Date.now().toString(), date, amt });
        } else if (activeType === "asset") {
            d.bal = amt; // Assets update to the exact current balance you type
            d.history.unshift({ id: Date.now().toString(), date, amt });
        } else {
            d.bal += amt;
            d.history.unshift({ id: Date.now().toString(), date, amt });
        }
    }
    renderGrid(); closeModal();
}

renderGrid();
