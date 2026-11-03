 <script>
        let accounts = [];
        let ledger = [];

        const defaultAccounts = [
            { id: '1', name: 'Mission Lane Black', type: 'liability', balance: 1410, initial: 1410, apr: '33.99%', target: 0, minPayment: '', dueDate: '', completed: false },
            { id: '2', name: 'Mission Lane Regular', type: 'liability', balance: 2520, initial: 2520, apr: '28.74%', target: 0, minPayment: '', dueDate: '', completed: false },
            { id: '3', name: 'Ollo Card', type: 'liability', balance: 1460, initial: 1460, apr: '27.24%', target: 0, minPayment: '', dueDate: '', completed: false },
            { id: '4', name: 'Happen Bank Loan', type: 'liability', balance: 1720, initial: 1720, apr: '25.49%', target: 0, minPayment: '', dueDate: '', completed: false },
            { id: '5', name: 'OneMain Financial', type: 'liability', balance: 7626, initial: 7626, apr: '24.49%', target: 0, minPayment: '', dueDate: '', completed: false },
            { id: '6', name: 'Affirm Financing', type: 'liability', balance: 777, initial: 777, apr: 'Fixed Fee', target: 0, minPayment: '', dueDate: '', completed: false },
            { id: '7', name: 'PayPal Credit', type: 'liability', balance: 1580, initial: 1580, apr: 'Closed', target: 0, minPayment: '', dueDate: '', completed: false }
        ];

        function initDashboard() {
            const storedAccounts = localStorage.getItem('avalanche_accounts');
            const storedLedger = localStorage.getItem('avalanche_ledger');

            if (storedAccounts) {
                accounts = JSON.parse(storedAccounts);
            } else {
                accounts = [...defaultAccounts];
                localStorage.setItem('avalanche_accounts', JSON.stringify(accounts));
            }

            if (storedLedger) {
                ledger = JSON.parse(storedLedger);
            } else {
                ledger = [];
            }

            // Set matrix default date to today
            document.getElementById('matrixDate').value = new Date().toISOString().split('T')[0];

            renderDashboard();
        }

        function saveToStorage() {
            localStorage.setItem('avalanche_accounts', JSON.stringify(accounts));
            localStorage.setItem('avalanche_ledger', JSON.stringify(ledger));
        }

        function triggerResetState() {
            if (confirm("Reset Dashboard back to baseline defaults? This completely wipes custom configurations, added accounts, and logged transaction items.")) {
                localStorage.removeItem('avalanche_accounts');
                localStorage.removeItem('avalanche_ledger');
                accounts = [...defaultAccounts];
                ledger = [];
                renderDashboard();
            }
        }

        function toggleViewMode() {
            const mode = document.getElementById('viewToggle').value;
            if (mode === 'grid') {
                document.getElementById('gridWorkspace').style.display = 'grid';
                document.getElementById('diagramView').style.display = 'none';
            } else {
                document.getElementById('gridWorkspace').style.display = 'none';
                document.getElementById('diagramView').style.display = 'block';
            }
        }

        function toggleFormGoalField() {
            const cls = document.getElementById('newNodeClass').value;
            if (cls === 'asset') {
                document.getElementById('aprFormGroup').style.display = 'none';
                document.getElementById('goalFormGroup').style.display = 'block';
                document.getElementById('balanceLabel').innerText = "Current Balance ($)";
            } else {
                document.getElementById('aprFormGroup').style.display = 'block';
                document.getElementById('goalFormGroup').style.display = 'none';
                document.getElementById('balanceLabel').innerText = "Stated Current Balance";
            }
        }

        function calculateMetrics() {
            let totalAssets = 0;
            let totalDebt = 0;
            let totalAprWeights = 0;
            let aprTrackedCount = 0;

            accounts.forEach(acc => {
                if (acc.type === 'asset') {
                    totalAssets += parseFloat(acc.balance || 0);
                } else {
                    totalDebt += parseFloat(acc.balance || 0);
                    let aprNum = parseFloat(acc.apr);
                    if (!isNaN(aprNum)) {
                        totalAprWeights += aprNum;
                        aprTrackedCount++;
                    }
                }
            });

            let netWorth = totalAssets - totalDebt;
            let avgApr = aprTrackedCount > 0 ? (totalAprWeights / aprTrackedCount).toFixed(2) + '%' : '0.00%';

            document.getElementById('statNetWorth').innerText = (netWorth >= 0 ? '$' : '-$') + Math.abs(netWorth).toLocaleString();
            document.getElementById('statAssets').innerText = '$' + totalAssets.toLocaleString();
            document.getElementById('statDebt').innerText = '$' + totalDebt.toLocaleString();
            document.getElementById('statAvgApr').innerText = avgApr;

            // Calculate fill percentages for lines
            let assetGoal = 50000; 
            let debtBaseline = 25000;

            document.getElementById('progressNetWorth').style.width = Math.min(Math.max((netWorth + 10000) / 60000 * 100, 0), 100) + '%';
            document.getElementById('progressAssets').style.width = Math.min((totalAssets / assetGoal) * 100, 100) + '%';
            document.getElementById('progressDebt').style.width = Math.min((totalDebt / debtBaseline) * 100, 100) + '%';
            document.getElementById('progressApr').style.width = aprTrackedCount > 0 ? Math.min((totalAprWeights / aprTrackedCount) / 35 * 100, 100) + '%' : '0%';

            // Update diagrams view
            document.getElementById('diagramAssetLabel').innerText = '$' + totalAssets.toLocaleString();
            document.getElementById('diagramDebtLabel').innerText = '$' + totalDebt.toLocaleString();
            
            let maxBar = Math.max(totalAssets, totalDebt, 1);
            document.getElementById('diagramAssetBar').style.width = (totalAssets / maxBar * 100) + '%';
            document.getElementById('diagramDebtBar').style.width = (totalDebt / maxBar * 100) + '%';
        }

        function renderDashboard() {
            calculateMetrics();

            const assetContainer = document.getElementById('assetContainer');
            const liabilityContainer = document.getElementById('liabilityContainer');
            const matrixSelect = document.getElementById('matrixAccount');

            assetContainer.innerHTML = '';
            liabilityContainer.innerHTML = '';
            matrixSelect.innerHTML = '';

            // Split accounts
            let assets = accounts.filter(a => a.type === 'asset');
            let liabilities = accounts.filter(a => a.type === 'liability');

            // Apply Sort Algorithms
            const aSort = document.getElementById('assetSort').value;
            if (aSort === 'balance-asc') assets.sort((a,b) => a.balance - b.balance);
            if (aSort === 'balance-desc') assets.sort((a,b) => b.balance - a.balance);

            const lSort = document.getElementById('liabilitySort').value;
            if (lSort === 'apr-desc') {
                liabilities.sort((a,b) => (parseFloat(b.apr) || 0) - (parseFloat(a.apr) || 0));
            } else if (lSort === 'balance-desc') {
                liabilities.sort((a,b) => b.balance - a.balance);
            } else if (lSort === 'duedate') {
                liabilities.sort((a,b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
            }

            // Populate options dropdown
            accounts.forEach(acc => {
                let opt = document.createElement('option');
                opt.value = acc.id;
                opt.innerText = acc.name + ` ($${acc.balance})`;
                matrixSelect.appendChild(opt);
            });

            // Render Assets Column
            if (assets.length === 0) {
                assetContainer.innerHTML = '<div style="color:var(--text-muted); font-style:italic; padding:10px; text-align:center;">No active assets. Use form below to deploy nodes.</div>';
            } else {
                assets.forEach(acc => {
                    let card = document.createElement('div');
                    card.className = `account-card`;
                    let goalValue = acc.goal || 10000;
                    let pct = Math.min(((acc.balance / goalValue) * 100), 100).toFixed(0);

                    card.innerHTML = `
                        <div class="card-row-top">
                            <div class="card-title-area">ð¢ ${acc.name}</div>
                            <div class="card-balance">$${parseFloat(acc.balance).toLocaleString()}</div>
                        </div>
                        <div class="card-meta-line">
                            <span>Goal Target: $${parseFloat(goalValue).toLocaleString()}</span>
                            <span>Progress: ${pct}%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${pct}%; background-color: var(--accent-blue);"></div>
                        </div>
                        <div class="inline-calculator">
                            <div class="calc-header">Integrated Asset Velocity Engine</div>
                            <div class="calc-grid">
                                <label style="display:flex; flex-direction:column; gap:2px; font-size:0.75rem; color:var(--text-muted);">
                                    Monthly Contrib ($)
                                    <input type="number" id="calcAmt-${acc.id}" value="200" oninput="runVelocityCalculation('${acc.id}', 'asset')">
                                </label>
                                <label style="display:flex; flex-direction:column; gap:2px; font-size:0.75rem; color:var(--text-muted);">
                                    Target Date Goal
                                    <input type="month" id="calcDate-${acc.id}" onchange="runVelocityCalculation('${acc.id}', 'asset-date')">
                                </label>
                            </div>
                            <div class="calc-result-text" id="calcResult-${acc.id}">Input values to forecast timeline...</div>
                            <button style="margin-top:2px; padding:4px;" onclick="applySimulationData('${acc.id}', 'asset')">Apply to Account Data</button>
                        </div>
                        <div class="card-actions">
                            <button onclick="openEditModal('${acc.id}')">âï¸ EDIT</button>
                        </div>
                    `;
                    assetContainer.appendChild(card);
                });
            }

            // Render Liabilities Column
            if (liabilities.length === 0) {
                liabilityContainer.innerHTML = '<div style="color:var(--text-muted); font-style:italic; padding:10px; text-align:center;">No liabilities logged. All clear!</div>';
            } else {
                liabilities.forEach(acc => {
                    let card = document.createElement('div');
                    card.className = `account-card ${acc.completed ? 'dimmed' : ''}`;
                    
                    card.innerHTML = `
                        <div class="card-row-top">
                            <div class="card-title-area">
                                <input type="checkbox" class="card-checkbox" ${acc.completed ? 'checked' : ''} onchange="toggleCardCompleted('${acc.id}', this.checked)">
                                <span style="${acc.completed ? 'text-decoration: line-through;' : ''}">${acc.name}</span>
                            </div>
                            <div class="card-balance">$${parseFloat(acc.balance).toLocaleString()}</div>
                        </div>
                        <div class="card-meta-line">
                            <span>APR: ${acc.apr}</span>
                        </div>
                        <div class="card-inputs-row">
                            <label>
                                Min Payment
                                <input type="number" value="${acc.minPayment || ''}" placeholder="0.00" onchange="updateCardIndividualInputs('${acc.id}', 'minPayment', this.value)">
                            </label>
                            <label>
                                Due Pay Date
                                <input type="date" value="${acc.dueDate || ''}" onchange="updateCardIndividualInputs('${acc.id}', 'dueDate', this.value)">
                            </label>
                        </div>
                        <div class="inline-calculator">
                            <div class="calc-header">Integrated Debt Payoff Velocity Simulator</div>
                            <div class="calc-grid">
                                <label style="display:flex; flex-direction:column; gap:2px; font-size:0.75rem; color:var(--text-muted);">
                                    Monthly Payment ($)
                                    <input type="number" id="calcAmt-${acc.id}" value="${acc.minPayment || 50}" oninput="runVelocityCalculation('${acc.id}', 'liability')">
                                </label>
                                <label style="display:flex; flex-direction:column; gap:2px; font-size:0.75rem; color:var(--text-muted);">
                                    Target Payoff Date
                                    <input type="month" id="calcDate-${acc.id}" onchange="runVelocityCalculation('${acc.id}', 'liability-date')">
                                </label>
                            </div>
                            <div class="calc-result-text" id="calcResult-${acc.id}">Input values to forecast timeline...</div>
                            <button style="margin-top:2px; padding:4px;" onclick="applySimulationData('${acc.id}', 'liability')">Apply to Account Data</button>
                        </div>
                        <div class="card-actions">
                            <button onclick="openEditModal('${acc.id}')">âï¸ EDIT</button>
                        </div>
                    `;
                    liabilityContainer.appendChild(card);
                    // Pre-run calculation for items
                    runVelocityCalculation(acc.id, 'liability');
                });
            }

            renderLedgerTable();
        }

        function toggleCardCompleted(id, isChecked) {
            let acc = accounts.find(a => a.id === id);
            if (acc) {
                acc.completed = isChecked;
                saveToStorage();
                renderDashboard();
            }
        }

        function updateCardIndividualInputs(id, key, val) {
            let acc = accounts.find(a => a.id === id);
            if (acc) {
                acc[key] = val;
                saveToStorage();
            }
        }

        function runVelocityCalculation(id, context) {
            let acc = accounts.find(a => a.id === id);
            if (!acc) return;

            const amtInput = document.getElementById(`calcAmt-${id}`);
            const dateInput = document.getElementById(`calcDate-${id}`);
            const resultBox = document.getElementById(`calcResult-${id}`);

            if (!amtInput || !dateInput || !resultBox) return;

            let balance = parseFloat(acc.balance || 0);
            if (balance <= 0) {
                resultBox.innerText = "Account balance is zero.";
                return;
            }

            if (context === 'asset') {
                // Change payment -> calculate target timeline date
                let monthlyContrib = parseFloat(amtInput.value) || 0;
                let goal = parseFloat(acc.goal) || 10000;
                if (monthlyContrib <= 0) {
                    resultBox.innerText = "Set a valid contribution amount.";
                    return;
                }
                let needed = goal - balance;
                if (needed <= 0) {
                    resultBox.innerText = "Goal achieved!";
                    return;
                }
                let months = Math.ceil(needed / monthlyContrib);
                let targetDate = new Date();
                targetDate.setMonth(targetDate.getMonth() + months);
                let outStr = targetDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                resultBox.innerText = `Reaches target in ${months} mos (${outStr})`;
                
                // Set the corresponding input safely without looping
                let y = targetDate.getFullYear();
                let m = String(targetDate.getMonth() + 1).padStart(2, '0');
                dateInput.value = `${y}-${m}`;

            } else if (context === 'asset-date') {
                // Change date -> calculate required monthly payment
                if (!dateInput.value) return;
                let parts = dateInput.value.split('-');
                let targetDate = new Date(parts[0], parts[1] - 1, 1);
                let now = new Date();
                let months = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
                if (months <= 0) months = 1;
                
                let goal = parseFloat(acc.goal) || 10000;
                let needed = goal - balance;
                if (needed <= 0) {
                    resultBox.innerText = "Goal achieved!";
                    return;
                }
                let requiredPay = (needed / months).toFixed(2);
                amtInput.value = requiredPay;
                resultBox.innerText = `Requires $${requiredPay}/mo for ${months} months`;

            } else if (context === 'liability') {
                // Change payment -> calculate target timeline date
                let monthlyPayment = parseFloat(amtInput.value) || 0;
                let apr = parseFloat(acc.apr) || 0;
                let monthlyRate = (apr / 100) / 12;

                if (monthlyPayment <= 0) {
                    resultBox.innerText = "Set a valid monthly payment.";
                    return;
                }

                if (monthlyRate > 0 && monthlyPayment <= balance * monthlyRate) {
                    resultBox.innerText = "Warning: Payment below monthly interest accrual.";
                    return;
                }

                let months = 0;
                let tempBalance = balance;
                while (tempBalance > 0 && months < 360) {
                    tempBalance += tempBalance * monthlyRate;
                    tempBalance -= monthlyPayment;
                    months++;
                }

                let targetDate = new Date();
                targetDate.setMonth(targetDate.getMonth() + months);
                let outStr = targetDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                resultBox.innerText = `Cleared in ${months} mos (${outStr})`;

                let y = targetDate.getFullYear();
                let m = String(targetDate.getMonth() + 1).padStart(2, '0');
                dateInput.value = `${y}-${m}`;

            } else if (context === 'liability-date') {
                // Change date -> calculate required monthly payment
                if (!dateInput.value) return;
                let parts = dateInput.value.split('-');
                let targetDate = new Date(parts[0], parts[1] - 1, 1);
                let now = new Date();
                let months = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
                if (months <= 0) months = 1;

                let apr = parseFloat(acc.apr) || 0;
                let monthlyRate = (apr / 100) / 12;

                let requiredPay = 0;
                if (monthlyRate === 0) {
                    requiredPay = (balance / months).toFixed(2);
                } else {
                    requiredPay = ((balance * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)).toFixed(2);
                }

                if (!isNaN(requiredPay) && isFinite(requiredPay)) {
                    amtInput.value = requiredPay;
                    resultBox.innerText = `Requires $${requiredPay}/mo for ${months} months`;
                }
            }
        }

        function applySimulationData(id, type) {
            let acc = accounts.find(a => a.id === id);
            if (!acc) return;

            const amtInput = document.getElementById(`calcAmt-${id}`);
            if (!amtInput) return;

            let val = parseFloat(amtInput.value);
            if (val > 0) {
                if (type === 'liability') {
                    acc.minPayment = val;
                }
                alert(`Applied simulation monthly data factor ($${val}) to main record attributes.`);
                saveToStorage();
                renderDashboard();
            }
        }

        function provisionNewNode() {
            const name = document.getElementById('newNodeName').value.trim();
            const type = document.getElementById('newNodeClass').value;
            const balance = parseFloat(document.getElementById('newNodeBalance').value) || 0;
            const apr = document.getElementById('newNodeApr').value.trim() || '0%';
            const goal = parseFloat(document.getElementById('newNodeGoal').value) || 0;

            if (!name) {
                alert("Please declare an account title.");
                return;
            }

            let newId = String(Date.now());
            let newNode = {
                id: newId,
                name: name,
                type: type,
                balance: balance,
                initial: balance,
                apr: type === 'liability' ? apr : '0%',
                goal: type === 'asset' ? goal : 0,
                minPayment: '',
                dueDate: '',
                completed: false
            };

            accounts.push(newNode);
            saveToStorage();
            renderDashboard();

            // Clear inputs
            document.getElementById('newNodeName').value = '';
            document.getElementById('newNodeBalance').value = '';
            document.getElementById('newNodeApr').value = '';
            document.getElementById('newNodeGoal').value = '';
        }

        function submitMatrixTransaction() {
            const nodeId = document.getElementById('matrixAccount').value;
            const amount = parseFloat(document.getElementById('matrixAmount').value) || 0;
            const execDate = document.getElementById('matrixDate').value;
            const cycle = document.getElementById('matrixInterval').value;

            if (!nodeId || amount <= 0) {
                alert("Ensure a destination active account node and a positive currency value are set.");
                return;
            }

            let acc = accounts.find(a => a.id === nodeId);
            if (!acc) return;

            // Recalculate node balance framework
            if (acc.type === 'asset') {
                acc.balance += amount; // Save additions
            } else {
                acc.balance = Math.max(acc.balance - amount, 0); // Paying down a liability shrinks balance
            }

            // Push transaction record log
            ledger.unshift({
                date: execDate,
                accountName: acc.name,
                amount: amount,
                cycle: cycle
            });

            saveToStorage();
            renderDashboard();
            
            // clear entry amount line
            document.getElementById('matrixAmount').value = '';
        }

        function renderLedgerTable() {
            const tbody = document.getElementById('ledgerBody');
            tbody.innerHTML = '';

            if (ledger.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-muted); text-align:center; font-style:italic;">No logged transactional operations queued.</td></tr>';
                return;
            }

            ledger.forEach(item => {
                let row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.date}</td>
                    <td style="font-weight:600; color:#fff;">${item.accountName}</td>
                    <td style="color:var(--accent-success); font-weight:600;">$${parseFloat(item.amount).toLocaleString()}</td>
                    <td style="text-transform: capitalize; color:var(--text-muted);">${item.cycle.replace('-', ' ')}</td>
                `;
                tbody.appendChild(row);
            });
        }

        function exportLedgerCsv() {
            if (ledger.length === 0) {
                alert("No structural transacted logs to backup export.");
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,Execution Date,Target Node,Amount,Cycle Type\n";
            ledger.forEach(l => {
                csvContent += `${l.date},"${l.accountName}",${l.amount},${l.cycle}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "transaction_ledger_backup.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function openEditModal(id) {
            let acc = accounts.find(a => a.id === id);
            if (!acc) return;

            document.getElementById('editNodeId').value = acc.id;
            document.getElementById('editNodeName').value = acc.name;
            document.getElementById('editNodeBalance').value = acc.balance;

            if (acc.type === 'asset') {
                document.getElementById('editNodeAprGroup').style.display = 'none';
                document.getElementById('editNodeGoalGroup').style.display = 'block';
                document.getElementById('editNodeGoal').value = acc.goal || 0;
            } else {
                document.getElementById('editNodeAprGroup').style.display = 'block';
                document.getElementById('editNodeGoalGroup').style.display = 'none';
                document.getElementById('editNodeApr').value = acc.apr || '';
            }

            document.getElementById('editModal').classList.add('active');
        }

        function closeEditModal() {
            document.getElementById('editModal').classList.remove('active');
        }

        function saveNodeModifications() {
            let id = document.getElementById('editNodeId').value;
            let acc = accounts.find(a => a.id === id);
            if (!acc) return;

            let newName = document.getElementById('editNodeName').value.trim();
            let newBal = parseFloat(document.getElementById('editNodeBalance').value) || 0;

            if (!newName) {
                alert("Account frame title cannot be left empty.");
                return;
            }

            acc.name = newName;
            acc.balance = newBal;

            if (acc.type === 'asset') {
                acc.goal = parseFloat(document.getElementById('editNodeGoal').value) || 0;
            } else {
                acc.apr = document.getElementById('editNodeApr').value.trim();
            }

            saveToStorage();
            closeEditModal();
            renderDashboard();
        }

        function deleteNodeEntry() {
            let id = document.getElementById('editNodeId').value;
            if (confirm("Permanently strip this node entry out of your structural dashboard list map?")) {
                accounts = accounts.filter(a => a.id !== id);
                saveToStorage();
                closeEditModal();
                renderDashboard();
            }
        }

        window.onload = initDashboard;
    </script>
</body>
</html>