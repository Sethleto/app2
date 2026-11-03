<script>
    // Master Initial Baseline State Array Dataset
    const DEFAULT_ACCOUNTS = [
        { id: "1", type: "liability", name: "1. Mission Lane Black", balance: 1410, apr: "33.99%", initial: 1410, target: 0, minPay: 45, dueDate: "2026-11-15", completed: false },
        { id: "2", type: "liability", name: "2. Mission Lane Regular", balance: 2520, apr: "28.74%", initial: 2520, target: 0, minPay: 75, dueDate: "2026-11-10", completed: false },
        { id: "3", type: "liability", name: "3. Ollo Card", balance: 1460, apr: "27.24%", initial: 1460, target: 0, minPay: 40, dueDate: "2026-11-20", completed: false },
        { id: "4", type: "liability", name: "4. Happen Bank Loan", balance: 1720, apr: "25.49%", initial: 1720, target: 0, minPay: 90, dueDate: "2026-11-05", completed: false },
        { id: "5", type: "liability", name: "5. OneMain Financial", balance: 7626, apr: "24.49%", initial: 7626, target: 0, minPay: 210, dueDate: "2026-11-18", completed: false },
        { id: "6", type: "liability", name: "6. Affirm Financing", balance: 777, apr: "Fixed Fee", initial: 777, target: 0, minPay: 65, dueDate: "2026-11-25", completed: false },
        { id: "7", type: "liability", name: "7. PayPal Credit", balance: 1580, apr: "Closed", initial: 1580, target: 0, minPay: 50, dueDate: "2026-11-12", completed: false },
        { id: "8", type: "asset", name: "Emergency Savings", balance: 1200, initial: 1200, targetGoal: 5000 }
    ];

    let accounts = [];
    let ledger = [];
    let isDiagramViewActive = false;

    // Load state initialization hooks from localStorage
    function initDashboardState() {
        const storedAccounts = localStorage.getItem("avalanche_accounts_v3");
        const storedLedger = localStorage.getItem("avalanche_ledger_v3");

        if (storedAccounts) {
            accounts = JSON.parse(storedAccounts);
        } else {
            accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
        }

        if (storedLedger) {
            ledger = JSON.parse(storedLedger);
        } else {
            ledger = [];
        }

        // Set default date parameter in the matrix picker form
        document.getElementById("matrix-date").value = "2026-11-03";

        renderDashboard();
    }

    function saveToLocalStorage() {
        localStorage.setItem("avalanche_accounts_v3", JSON.stringify(accounts));
        localStorage.setItem("avalanche_ledger_v3", JSON.stringify(ledger));
    }

    function resetEngineState() {
        localStorage.removeItem("avalanche_accounts_v3");
        localStorage.removeItem("avalanche_ledger_v3");
        accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
        ledger = [];
        renderDashboard();
    }

    function toggleProvGoalField() {
        const cl = document.getElementById("prov-class").value;
        document.getElementById("prov-goal-row").style.display = cl === 'asset' ? 'grid' : 'none';
        document.getElementById("prov-apr-row").style.display = cl === 'liability' ? 'grid' : 'none';
    }

    function toggleDashboardView() {
        isDiagramViewActive = !isDiagramViewActive;
        document.getElementById("diagram-view").style.display = isDiagramViewActive ? "block" : "none";
        document.getElementById("grid-view").style.display = isDiagramViewActive ? "none" : "grid";
        if (isDiagramViewActive) renderDiagram();
    }

    // Calculations Summary Engines Update Pipeline
    function updateMainSummaries() {
        let totalAsset = 0;
        let totalLiability = 0;
        let totalSavingsGoals = 0;

        accounts.forEach(acc => {
            if (acc.type === 'asset') {
                totalAsset += parseFloat(acc.balance || 0);
                totalSavingsGoals += parseFloat(acc.targetGoal || 0);
            } else {
                totalLiability += parseFloat(acc.balance || 0);
            }
        });

        const netWorth = totalAsset - totalLiability;
        
        // Populate Summary Node View Boxes Text fields
        document.getElementById("net-worth-val").innerText = (netWorth >= 0 ? "" : "-") + "$" + Math.abs(netWorth).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
        document.getElementById("savings-val").innerText = "$" + totalAsset.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
        document.getElementById("debt-val").innerText = "$" + totalLiability.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

        // Calculate progress bars ratios dynamically
        let nwPercent = totalAsset > 0 ? (netWorth / totalAsset) * 100 : 0;
        document.getElementById("net-worth-progress").style.width = Math.max(0, Math.min(100, nwPercent)) + "%";

        let assetGoalPercent = totalSavingsGoals > 0 ? (totalAsset / totalSavingsGoals) * 100 : 0;
        document.getElementById("savings-progress").style.width = Math.min(100, assetGoalPercent) + "%";

        // Liability progress compared to original values
        let originalDebt = DEFAULT_ACCOUNTS.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.initial, 0);
        let debtPercent = originalDebt > 0 ? ((originalDebt - totalLiability) / originalDebt) * 100 : 0;
        document.getElementById("debt-progress").style.width = Math.max(0, Math.min(100, debtPercent)) + "%";

        // Total milestone completed growth percentage metric
        let combinedProgress = assetGoalPercent;
        document.getElementById("ratio-val").innerText = Math.round(combinedProgress) + "%";
        document.getElementById("ratio-progress").style.width = Math.min(100, combinedProgress) + "%";
    }

    // Dynamic View Builders for Stacks Columns
    function renderDashboard() {
        updateMainSummaries();
        saveToLocalStorage();

        // Populate dropdown selectors in forms matrix arrays
        const matrixSelect = document.getElementById("matrix-account-select");
        matrixSelect.innerHTML = "";
        accounts.forEach(acc => {
            const opt = document.createElement("option");
            opt.value = acc.id;
            opt.innerText = acc.name;
            matrixSelect.appendChild(opt);
        });

        // Split lists for sorting and filtering execution arrays
        let assetList = accounts.filter(a => a.type === 'asset');
        let liabilityList = accounts.filter(a => a.type === 'liability');

        // Execute Asset Sorting Mechanics
        const assetSortVal = document.getElementById("asset-sort").value;
        if (assetSortVal === "balance-desc") assetList.sort((a,b) => b.balance - a.balance);
        if (assetSortVal === "balance-asc") assetList.sort((a,b) => a.balance - b.balance);

        // Execute Liability Filters
        const liabFilterVal = document.getElementById("liability-filter").value;
        if (liabFilterVal === "pending") {
            liabilityList = liabilityList.filter(l => !l.completed);
        }

        // Execute Liability Active Sorting Engines (Upcoming Due Date default pipeline)
        const liabSortVal = document.getElementById("liability-sort").value;
        if (liabSortVal === "duedate") {
            liabilityList.sort((a,b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        } else if (liabSortVal === "apr") {
            liabilityList.sort((a,b) => {
                let aprA = parseFloat(a.apr) || 0;
                let aprB = parseFloat(b.apr) || 0;
                return aprB - aprA;
            });
        } else if (liabSortVal === "balance") {
            liabilityList.sort((a,b) => a.balance - b.balance);
        }

        // Render Stacks Nodes inside HTML containers
        const assetRoot = document.getElementById("asset-stack-root");
        assetRoot.innerHTML = "";
        assetList.forEach(acc => {
            assetRoot.appendChild(buildAccountCardHTML(acc));
        });

        const liabilityRoot = document.getElementById("liability-stack-root");
        liabilityRoot.innerHTML = "";
        liabilityList.forEach(acc => {
            liabilityRoot.appendChild(buildAccountCardHTML(acc));
        });

        // Refresh transaction matrix grid rows log
        renderLedgerRows();
        if (isDiagramViewActive) renderDiagram();
    }

    // Build Standalone Dynamic Card Elements Component Nodes Block Template
    function buildAccountCardHTML(acc) {
        const card = document.createElement("div");
        card.className = `account-card ${acc.type} ${acc.completed ? 'completed' : ''}`;
        card.id = `card-node-${acc.id}`;

        let metaInfo = "";
        let specificInputs = "";

        if (acc.type === 'liability') {
            metaInfo = `<div>APR: ${acc.apr}</div>`;
            specificInputs = `
                <div class="card-changeable-fields">
                    <div class="field-group">
                        <label>Min Payment ($)</label>
                        <input type="number" id="minpay-input-${acc.id}" value="${acc.minPay || 0}" step="0.01" onchange="updateInlineCardData('${acc.id}', 'minPay', this.value)">
                    </div>
                    <div class="field-group">
                        <label>Due Pay Date</label>
                        <input type="date" id="duedate-input-${acc.id}" value="${acc.dueDate || ''}" onchange="updateInlineCardData('${acc.id}', 'dueDate', this.value)">
                    </div>
                </div>
            `;
        } else {
            metaInfo = `<div>Goal Target: $${(acc.targetGoal || 0).toLocaleString()}</div>`;
        }

        // Checkbox element for tracking visual completed dimming matrix pipeline rows
        const checkboxToggle = acc.type === 'liability' ? 
            `<input type="checkbox" ${acc.completed ? 'checked' : ''} onclick="toggleCardCompletion('${acc.id}', event)">` : '';

        // Pure Numeric Integrated Simulator subbox layout template markup
        const simEngineUI = `
            <div class="calc-box">
                <div class="calc-box-title">ð§® Pure Numeric Projection Calculator</div>
                <div class="calc-inputs">
                    <div class="field-group">
                        <label>Simulated Pay ($/mo)</label>
                        <input type="number" id="sim-pay-${acc.id}" placeholder="e.g. 150" step="0.01" oninput="calculateCardSimulation('${acc.id}', 'pay')">
                    </div>
                    <div class="field-group">
                        <label>Simulated Target Date</label>
                        <input type="month" id="sim-date-${acc.id}" onchange="calculateCardSimulation('${acc.id}', 'date')">
                    </div>
                </div>
                <div class="calc-result" id="sim-result-${acc.id}">Input values to simulate metric transformations...</div>
                <button type="button" class="btn btn-blue" style="font-size:10px; padding:4px 8px; width:100%" onclick="applySimulationToCore('${acc.id}')">Apply To Account Data</button>
            </div>
        `;

        card.innerHTML = `
            <div class="card-header-row">
                <div class="card-title-container">
                    ${checkboxToggle}
                    <span class="card-title">${acc.name}</span>
                </div>
                <span class="card-value">$${parseFloat(acc.balance || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            <div class="card-meta">
                ${metaInfo}
                <div>Initial: $${acc.initial || acc.balance}</div>
            </div>
            ${specificInputs}
            ${simEngineUI}
            <div class="card-actions">
                <button class="btn btn-blue" style="font-size:10px; padding:3px 8px;" onclick="openEditModalFrame('${acc.id}')">âï¸ Edit</button>
            </div>
        `;

        return card;
    }

    // Dynamic Live Inline Inputs Data Sync Changes Handlers 
    function updateInlineCardData(id, parameter, value) {
        const acc = accounts.find(a => a.id === id);
        if (acc) {
            if (parameter === 'minPay' || parameter === 'balance') {
                acc[parameter] = parseFloat(value) || 0;
            } else {
                acc[parameter] = value;
            }
            saveToLocalStorage();
            if (parameter === 'dueDate') {
                // Instantly re-trigger structural pipeline rendering sorting cascade matrix arrays
                renderDashboard();
            } else {
                updateMainSummaries();
            }
        }
    }

    function toggleCardCompletion(id, event) {
        event.stopPropagation();
        const acc = accounts.find(a => a.id === id);
        if (acc) {
            acc.completed = event.target.checked;
            renderDashboard();
        }
    }

    // Bi-Directional Coupled Pure Numeric Financial Equations Script Pipeline
    function calculateCardSimulation(id, primaryTriggerField) {
        const acc = accounts.find(a => a.id === id);
        if (!acc) return;

        const payInput = document.getElementById(`sim-pay-${id}`);
        const dateInput = document.getElementById(`sim-date-${id}`);
        const resultDisplay = document.getElementById(`sim-result-${id}`);

        let currentBalance = parseFloat(acc.balance) || 0;

        if (primaryTriggerField === 'pay') {
            let monthlyPayment = parseFloat(payInput.value) || 0;
            if (monthlyPayment <= 0) {
                resultDisplay.innerText = "Monthly payment must be greater than zero.";
                return;
            }

            if (acc.type === 'liability') {
                let apr = parseFloat(acc.apr) || 0;
                if (apr > 0) {
                    let monthlyRate = (apr / 100) / 12;
                    // Check if payment covers interest
                    if (monthlyPayment <= currentBalance * monthlyRate) {
                        resultDisplay.innerText = "â ï¸ Payment is too low to cover monthly interest accrual.";
                        return;
                    }
                    // Amortization Month counts calculation formula
                    let months = -Math.log(1 - (currentBalance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate);
                    months = Math.ceil(months);
                    
                    let targetCalendar = calculateFutureMonthDate(months);
                    resultDisplay.innerText = `Achieved: ${targetCalendar} (${months} Months Remaining)`;
                    dateInput.value = formatYearMonthInputValue(months);
                } else {
                    let months = Math.ceil(currentBalance / monthlyPayment);
                    let targetCalendar = calculateFutureMonthDate(months);
                    resultDisplay.innerText = `Achieved: ${targetCalendar} (${months} Months Remaining)`;
                    dateInput.value = formatYearMonthInputValue(months);
                }
            } else {
                // Wealth generation asset target matrix calculations
                let target = parseFloat(acc.targetGoal) || 0;
                if (currentBalance >= target) {
                    resultDisplay.innerText = "Savings Milestone goal is already achieved!";
                    return;
                }
                let needed = target - currentBalance;
                let months = Math.ceil(needed / monthlyPayment);
                let targetCalendar = calculateFutureMonthDate(months);
                resultDisplay.innerText = `Achieved: ${targetCalendar} (${months} Months Remaining)`;
                dateInput.value = formatYearMonthInputValue(months);
            }
        } else if (primaryTriggerField === 'date') {
            if (!dateInput.value) return;
            let chosenDate = new Date(dateInput.value + "-01");
            let today = new Date("2026-11-01");
            let monthsCount = (chosenDate.getFullYear() - today.getFullYear()) * 12 + (chosenDate.getMonth() - today.getMonth());
            
            if (monthsCount <= 0) {
                resultDisplay.innerText = "Target date must be in the future.";
                return;
            }

            if (acc.type === 'liability') {
                let apr = parseFloat(acc.apr) || 0;
                if (apr > 0) {
                    let monthlyRate = (apr / 100) / 12;
                    // Formula to find required fixed payment for explicit timeline horizon
                    let reqPayment = (currentBalance * monthlyRate * Math.pow(1 + monthlyRate, monthsCount)) / (Math.pow(1 + monthlyRate, monthsCount) - 1);
                    payInput.value = reqPayment.toFixed(2);
                    resultDisplay.innerText = `Required Contribution: $${reqPayment.toFixed(2)}/mo over ${monthsCount} Mos.`;
                } else {
                    let reqPayment = currentBalance / monthsCount;
                    payInput.value = reqPayment.toFixed(2);
                    resultDisplay.innerText = `Required Contribution: $${reqPayment.toFixed(2)}/mo over ${monthsCount} Mos.`;
                }
            } else {
                let target = parseFloat(acc.targetGoal) || 0;
                let needed = Math.max(0, target - currentBalance);
                let reqPayment = needed / monthsCount;
                payInput.value = reqPayment.toFixed(2);
                resultDisplay.innerText = `Required Contribution: $${reqPayment.toFixed(2)}/mo over ${monthsCount} Mos.`;
            }
        }
    }

    function calculateFutureMonthDate(monthsTotal) {
        let baseDate = new Date("2026-11-01");
        baseDate.setMonth(baseDate.getMonth() + monthsTotal);
        return baseDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }

    function formatYearMonthInputValue(monthsTotal) {
        let baseDate = new Date("2026-11-01");
        baseDate.setMonth(baseDate.getMonth() + monthsTotal);
        let y = baseDate.getFullYear();
        let m = String(baseDate.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }

    function applySimulationToCore(id) {
        const acc = accounts.find(a => a.id === id);
        if (!acc) return;
        const payInput = document.getElementById(`sim-pay-${id}`);
        
        if (payInput.value) {
            let finalizedVal = parseFloat(payInput.value) || 0;
            if (acc.type === 'liability') {
                acc.minPay = finalizedVal;
            }
            alert(`Velocity tracking synced! Stated monthly allocation parameters for ${acc.name} updated to $${finalizedVal}.`);
            renderDashboard();
        }
    }

    // Hybrid Automation matrix form submit implementation pipeline
    function handleMatrixSubmit(event) {
        event.preventDefault();
        const accId = document.getElementById("matrix-account-select").value;
        const amount = parseFloat(document.getElementById("matrix-amount").value) || 0;
        const dateString = document.getElementById("matrix-date").value;
        const interval = document.getElementById("matrix-recurrence").value;

        const acc = accounts.find(a => a.id === accId);
        if (!acc) return;

        // Mutate numeric data structures in real-time immediately
        if (acc.type === 'liability') {
            acc.balance = Math.max(0, acc.balance - amount);
        } else {
            acc.balance += amount;
        }

        // Deploy new transaction matrix ledger log entry block row
        const newLog = {
            date: dateString,
            accountName: acc.name,
            amount: amount,
            recurrence: interval
        };
        ledger.unshift(newLog);

        // Reset input fields
        document.getElementById("matrix-amount").value = "";

        renderDashboard();
    }

    function handleProvisionSubmit(event) {
        event.preventDefault();
        const name = document.getElementById("prov-name").value;
        const classification = document.getElementById("prov-class").value;
        const balance = parseFloat(document.getElementById("prov-balance").value) || 0;
        const apr = document.getElementById("prov-apr").value || "0%";
        const targetGoal = parseFloat(document.getElementById("prov-goal").value) || 0;

        const newId = String(Date.now());
        const newNode = {
            id: newId,
            type: classification,
            name: name,
            balance: balance,
            apr: classification === 'liability' ? apr : undefined,
            initial: balance,
            targetGoal: classification === 'asset' ? targetGoal : undefined,
            minPay: classification === 'liability' ? 25 : undefined,
            dueDate: classification === 'liability' ? "2026-11-01" : undefined,
            completed: false
        };

        accounts.push(newNode);
        
        // Reset form
        document.getElementById("prov-name").value = "";
        document.getElementById("prov-balance").value = "";
        document.getElementById("prov-apr").value = "";
        document.getElementById("prov-goal").value = "";

        renderDashboard();
    }

    function renderLedgerRows() {
        const root = document.getElementById("ledger-rows-root");
        if (ledger.length === 0) {
            root.innerHTML = `<tr><td colspan="4" style="color: var(--text-muted); text-align: center;">No matrix transaction rows logged.</td></tr>`;
            return;
        }

        root.innerHTML = "";
        ledger.forEach(log => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${log.date}</td>
                <td style="color: var(--accent-blue)">${log.accountName}</td>
                <td style="font-weight: bold;">$${log.amount.toFixed(2)}</td>
                <td style="color: var(--text-muted); font-size: 11px;">${log.recurrence}</td>
            `;
            root.appendChild(tr);
        });
    }

    // CSV Spreadsheet backup file generator engine download logic
    function exportSpreadsheetCSV() {
        if (ledger.length === 0) {
            alert("No logged transaction entries found to construct file data streams.");
            return;
        }

        let csvString = "Timestamp Date,Target Node Account,Action Amount,Interval Cycle\n";
        ledger.forEach(l => {
            csvString += `"${l.date}","${l.accountName}",${l.amount},"${l.recurrence}"\n`;
        });

        const blobFile = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const downstreamUrl = URL.createObjectURL(blobFile);
        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", downstreamUrl);
        linkElement.setAttribute("download", "transaction_ledger_backup.csv");
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
    }

    // Render clean horizontal bar breakdowns inside diagram panel
    function renderDiagram() {
        const root = document.getElementById("diagram-bars-root");
        root.innerHTML = "";

        accounts.forEach(acc => {
            const row = document.createElement("div");
            row.className = "diagram-bar-row";

            let maxValue = Math.max(...accounts.map(a => a.balance), 1000);
            let barWidthRatio = (acc.balance / maxValue) * 100;
            let colorHex = acc.type === 'asset' ? 'var(--accent-green)' : 'var(--primary)';

            row.innerHTML = `
                <div class="diagram-label-row">
                    <span>${acc.name}</span>
                    <span style="font-weight: bold; color: ${colorHex}">$${acc.balance.toLocaleString()}</span>
                </div>
                <div class="diagram-bar-outer">
                    <div class="diagram-bar-inner" style="width: ${barWidthRatio}%; background-color: ${colorHex}"></div>
                </div>
            `;
            root.appendChild(row);
        });
    }

    // Modal Configuration Frame Helpers
    function openEditModalFrame(id) {
        const acc = accounts.find(a => a.id === id);
        if (!acc) return;

        document.getElementById("edit-idx").value = id;
        document.getElementById("edit-name").value = acc.name;
        document.getElementById("edit-balance").value = acc.balance;

        if (acc.type === 'liability') {
            document.getElementById("edit-apr-row").style.display = "grid";
            document.getElementById("edit-goal-row").style.display = "none";
            document.getElementById("edit-apr").value = acc.apr || "";
        } else {
            document.getElementById("edit-apr-row").style.display = "none";
            document.getElementById("edit-goal-row").style.display = "grid";
            document.getElementById("edit-goal").value = acc.targetGoal || 0;
        }

        document.getElementById("edit-modal").classList.add("active");
    }

    function closeEditModal() {
        document.getElementById("edit-modal").classList.remove("active");
    }

    function saveNodeModifications() {
        const id = document.getElementById("edit-idx").value;
        const acc = accounts.find(a => a.id === id);
        if (acc) {
            acc.name = document.getElementById("edit-name").value;
            acc.balance = parseFloat(document.getElementById("edit-balance").value) || 0;
            if (acc.type === 'liability') {
                acc.apr = document.getElementById("edit-apr").value;
            } else {
                acc.targetGoal = parseFloat(document.getElementById("edit-goal").value) || 0;
            }
            closeEditModal();
            renderDashboard();
        }
    }

    function deleteNodeTrigger() {
        const id = document.getElementById("edit-idx").value;
        accounts = accounts.filter(a => a.id !== id);
        closeEditModal();
        renderDashboard();
    }

    // Initialize core dashboard application layout modules on run
    window.onload = initDashboardState;
</script>

</body>
</html>