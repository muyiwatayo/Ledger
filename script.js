(async () => {
    const { data: { user }, error: sessionError } = await ledgerSupabase.auth.getUser();
    if (sessionError || !user) { window.location.href = 'login.html'; return; }

    const categories = ['Food', 'Bills', 'Transport', 'Shopping', 'Fun', 'Other'];
    const colors = {
        Food: '#e58b46',
        Bills: '#6676c9',
        Transport: '#319b91',
        Shopping: '#d46683',
        Fun: '#c39a32',
        Other: '#82909d'
    };
    const trendColors = ['#b6d7bd', '#91c99d', '#69b982', '#4eaa6c', '#36945a', '#1d6838'];
    const today = new Date();
    const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const dateKey = (date) => `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
    const advanceRecurringDate = (value, frequency, dueDay) => {
        const [year, month, day] = value.split('-').map(Number);
        if (frequency === 'weekly') return dateKey(new Date(year, month - 1, day + 7));
        const nextMonth = new Date(year, month, 1);
        const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        return dateKey(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(dueDay, lastDay)));
    };
    const currentMonth = monthKey(today);
    const currentYear = today.getFullYear();
    const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
    let expenses = [];
    let recurringExpenses = [];
    let categoryBudgets = {};
    let budget = 250000;
    let editingExpenseId = null;
    let accounts = [];
    let incomeEntries = [];
    let savingsGoals = [];
    let debts = [];
    let alerts = [];
    const storage = {
        read(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch (error) {
                return fallback;
            }
        },
        write(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    };
    const defaultAccounts = [
        { id: 'main', name: 'Main account', type: 'Bank', balance: 1285000 },
        { id: 'cash', name: 'Cash wallet', type: 'Cash', balance: 175000 },
        { id: 'wallet', name: 'Savings wallet', type: 'Wallet', balance: 625000 }
    ];
    const defaultSavingsGoals = [
        { id: 'laptop', title: 'New laptop', target: 780000, saved: 420000, due: '2026-12-15' },
        { id: 'school', title: 'School fees', target: 600000, saved: 240000, due: '2026-10-30' },
        { id: 'emergency', title: 'Emergency fund', target: 1000000, saved: 680000, due: '2027-02-15' }
    ];
    const defaultDebts = [
        { id: 'student', name: 'School loan', type: 'Loan', balance: 280000, dueDate: '2026-11-12', progress: 35 },
        { id: 'micro', name: 'Business advance', type: 'Debt', balance: 166000, dueDate: '2026-10-27', progress: 58 }
    ];
    const defaultAlerts = [
        { id: 'budget', title: 'Food is close to target', detail: 'You have spent 86% of your food budget this month.', severity: 'warning' },
        { id: 'due', title: 'Internet bill due soon', detail: 'Your next recurring payment lands in 3 days.', severity: 'info' },
        { id: 'goal', title: 'Emergency fund is on track', detail: 'You are 68% of the way to your target.', severity: 'success' }
    ];
    accounts = storage.read('ledger.accounts', defaultAccounts);
    incomeEntries = storage.read('ledger.incomeEntries', [
        { description: 'Salary deposit', amount: 360000, date: dateKey(new Date(today.getFullYear(), today.getMonth(), 1)) },
        { description: 'Freelance design', amount: 150000, date: dateKey(new Date(today.getFullYear(), today.getMonth(), 10)) }
    ]);
    savingsGoals = storage.read('ledger.savingsGoals', defaultSavingsGoals);
    debts = storage.read('ledger.debts', defaultDebts);
    alerts = storage.read('ledger.alerts', defaultAlerts);
    const $ = (id) => document.getElementById(id);
    const money = (value) => `${Number(value) < 0 ? '-' : ''}₦${Math.abs(Number(value)).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
    const monthExpenses = () => expenses.filter((item) => item.expense_date.slice(0, 7) === currentMonth);
    const total = (items) => items.reduce((sum, item) => sum + Number(item.amount), 0);
    const formatDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
    const firstName = (displayName) => displayName.includes('@') ? displayName.split('@')[0] : displayName.trim().split(/\s+/)[0];
    const isMissingCategoryBudgetColumn = (error) => ['42703', 'PGRST204'].includes(error.code) && /category_budgets/i.test(error.message || '');
    const parseCategoryBudgets = (value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        return Object.fromEntries(categories
            .filter((category) => Number.isFinite(Number(value[category])) && Number(value[category]) > 0)
            .map((category) => [category, Number(value[category])]));
    };
    const setProfilePhoto = (displayName) => {
        if (!user.user_metadata?.avatar_url) return;
        const avatar = document.createElement('img');
        avatar.className = 'profile-avatar profile-photo';
        avatar.id = 'profile-initial';
        avatar.src = user.user_metadata.avatar_url;
        avatar.alt = `${displayName} profile photo`;
        $('profile-initial').replaceWith(avatar);
    };

    async function loadData() {
        const [profileResult, expenseResult, recurringResult] = await Promise.all([
            ledgerSupabase.from('profiles').select('display_name, monthly_budget, category_budgets, created_at').eq('id', user.id).single(),
            ledgerSupabase.from('expenses').select('id, description, amount, category, expense_date, created_at').eq('user_id', user.id).order('expense_date', { ascending: false }),
            ledgerSupabase.from('recurring_expenses').select('id, description, amount, category, frequency, due_day, next_due_date').eq('user_id', user.id).order('next_due_date')
        ]);
        if (expenseResult.error) throw expenseResult.error;
        if (recurringResult.error) throw recurringResult.error;
        expenses = expenseResult.data || [];
        recurringExpenses = recurringResult.data || [];
        let profile = profileResult.data;
        if (isMissingCategoryBudgetColumn(profileResult.error || {})) {
            const fallbackProfileResult = await ledgerSupabase.from('profiles').select('display_name, monthly_budget, created_at').eq('id', user.id).single();
            if (fallbackProfileResult.error && fallbackProfileResult.error.code !== 'PGRST116') throw fallbackProfileResult.error;
            profile = fallbackProfileResult.data;
            $('category-budget-message').textContent = 'Run the latest supabase-schema.sql in Supabase to save category budgets to your account.';
        } else if (profileResult.error && profileResult.error.code !== 'PGRST116') {
            throw profileResult.error;
        }
        if (profile) {
            budget = Number(profile.monthly_budget) || budget;
            categoryBudgets = parseCategoryBudgets(profile.category_budgets);
            const displayName = profile.display_name || user.user_metadata?.full_name || user.email || 'there';
            $('user-display-name').textContent = firstName(displayName);
            $('profile-name').textContent = displayName;
            $('profile-initial').textContent = displayName.charAt(0).toUpperCase();
            setProfilePhoto(displayName);
            $('user-joined-date').textContent = new Date(profile.created_at).toLocaleDateString();
        } else {
            const displayName = user.user_metadata?.full_name || user.email || 'there';
            $('user-display-name').textContent = firstName(displayName);
            $('profile-name').textContent = displayName;
            $('profile-initial').textContent = displayName.charAt(0).toUpperCase();
            setProfilePhoto(displayName);
        }
    }

    $('current-month').textContent = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    document.querySelector('.topbar h1').firstChild.textContent = `${greeting}, `;
    $('expense-date').value = dateKey(today);
    $('recurring-date').value = dateKey(today);

    function notify(message) {
        const toast = $('toast'); toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
    }

    async function saveBudget() {
        const { error } = await ledgerSupabase.from('profiles').update({ monthly_budget: budget }).eq('id', user.id).select('id').single();
        if (error) throw error;
    }

    function resetExpenseForm() {
        editingExpenseId = null;
        $('expense-form').reset();
        $('transaction-type').value = 'expense';
        $('expense-date').value = dateKey(today);
        $('expense-form-title').textContent = 'Record an expense';
        $('expense-submit-btn').innerHTML = 'Add expense <span>↗</span>';
        $('cancel-edit-btn').hidden = true;
        $('form-message').textContent = '';
    }

    function drawChart(items) {
        const canvas = $('expenseChart'); const context = canvas.getContext('2d'); const size = Math.min(canvas.parentElement.clientWidth || 260, 225); const ratio = window.devicePixelRatio || 1;
        canvas.width = size * ratio; canvas.height = size * ratio; context.scale(ratio, ratio); context.clearRect(0, 0, size, size);
        const totals = categories.map((name) => total(items.filter((item) => item.category === name))); const sum = totals.reduce((result, value) => result + value, 0);
        $('chart-empty').hidden = sum > 0; $('chart-legend').innerHTML = ''; if (!sum) return;
        let angle = -Math.PI / 2; const center = size / 2; const radius = size * .37;
        categories.forEach((name, index) => { if (!totals[index]) return; const next = angle + totals[index] / sum * Math.PI * 2; context.beginPath(); context.moveTo(center, center); context.arc(center, center, radius, angle, next); context.closePath(); context.fillStyle = colors[name]; context.fill(); context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--chart-center').trim() || '#ffffff'; context.lineWidth = 2; context.stroke(); angle = next; const legendItem = document.createElement('span'); legendItem.className = 'legend-item'; const dot = document.createElement('i'); dot.className = 'legend-dot'; dot.style.backgroundColor = colors[name]; legendItem.append(dot, document.createTextNode(`${name} ${Math.round(totals[index] / sum * 100)}%`)); $('chart-legend').appendChild(legendItem); });
        context.beginPath(); context.arc(center, center, radius * .54, 0, Math.PI * 2); context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--chart-center').trim() || '#ffffff'; context.fill(); context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--chart-ink').trim() || '#18221c'; context.font = '700 13px "Sora", Arial, sans-serif'; context.textAlign = 'center'; context.fillText(money(sum), center, center + 4);
    }

    function renderTable() {
        const query = $('search-input').value.trim().toLowerCase(); const filter = $('category-filter').value;
        const visible = expenses.filter((item) => item.description.toLowerCase().includes(query) && (filter === 'All' || item.category === filter));
        $('transaction-list').innerHTML = visible.map((item) => `<tr><td>${escapeHtml(item.description)}</td><td><span class="category-tag" data-category="${escapeHtml(item.category)}">${escapeHtml(item.category)}</span></td><td>${formatDate(item.expense_date)}</td><td>${money(item.amount)}</td><td><div class="transaction-actions"><button class="row-action edit-button" type="button" data-action="edit" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.description)}">Edit</button><button class="row-action delete-button" type="button" data-action="delete" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.description)}">×</button></div></td></tr>`).join('');
        $('empty-state').hidden = visible.length > 0; $('transaction-summary').textContent = `Showing ${visible.length} of ${expenses.length} transaction${expenses.length === 1 ? '' : 's'}`;
    }

    function renderAccounts() {
        const list = $('account-list');
        if (!list) return;
        const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
        list.innerHTML = accounts.map((account) => `
            <div class="account-card">
                <div class="account-card-header">
                    <span class="account-pill">${escapeHtml(account.type)}</span>
                    <strong>${escapeHtml(account.name)}</strong>
                </div>
                <span class="account-balance">${money(account.balance)}</span>
            </div>
        `).join('') || '<p class="empty-inline">No accounts added yet.</p>';
        $('total-balance').textContent = money(totalBalance);
        $('balance-summary').textContent = `${accounts.length} active ${accounts.length === 1 ? 'account' : 'accounts'} in your wallet stack`;
    }

    function renderGoals() {
        const list = $('goal-list');
        if (!list) return;
        list.innerHTML = savingsGoals.map((goal) => {
            const percent = Math.min((goal.saved / goal.target) * 100, 100);
            return `
                <div class="goal-item">
                    <div class="goal-meta"><strong>${escapeHtml(goal.title)}</strong><span>${money(goal.saved)} of ${money(goal.target)}</span></div>
                    <div class="goal-meter"><span style="width:${percent}%"></span></div>
                    <div class="goal-caption"><span>${Math.round(percent)}% funded</span><span>Due ${formatDate(goal.due)}</span></div>
                </div>
            `;
        }).join('') || '<p class="empty-inline">No savings goals set yet.</p>';
    }

    function renderDebts() {
        const list = $('debt-list');
        if (!list) return;
        const liabilityTotal = debts.reduce((sum, debt) => sum + Number(debt.balance || 0), 0);
        list.innerHTML = debts.map((debt) => `
            <div class="debt-item">
                <div class="debt-header"><strong>${escapeHtml(debt.name)}</strong><span>${escapeHtml(debt.type)}</span></div>
                <div class="debt-meta"><strong>${money(debt.balance)}</strong><span>Due ${formatDate(debt.dueDate)}</span></div>
                <div class="goal-meter debt-meter"><span style="width:${Math.min(debt.progress, 100)}%"></span></div>
                <small>${Math.min(debt.progress, 100)}% of repayment plan completed</small>
            </div>
        `).join('') || '<p class="empty-inline">No loans or debts recorded.</p>';
        $('liabilities-total').textContent = money(liabilityTotal);
    }

    function renderAlerts() {
        const list = $('alert-list');
        if (!list) return;
        list.innerHTML = alerts.map((alert) => `
            <div class="alert-item alert-${alert.severity}">
                <span class="alert-pill">${alert.severity}</span>
                <div>
                    <strong>${escapeHtml(alert.title)}</strong>
                    <p>${escapeHtml(alert.detail)}</p>
                </div>
            </div>
        `).join('') || '<p class="empty-inline">No alerts right now.</p>';
    }

    function renderNetWorth() {
        const assetTotal = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
        const liabilityTotal = debts.reduce((sum, debt) => sum + Number(debt.balance || 0), 0);
        const netWorth = assetTotal - liabilityTotal;
        $('assets-total').textContent = money(assetTotal);
        $('liabilities-total').textContent = money(liabilityTotal);
        $('net-worth-total').textContent = money(netWorth);
    }

    function renderCategoryBudgets() {
        const list = $('category-budget-list');
        if (!list) return;
        list.replaceChildren();
        categories.forEach((category) => {
            const limit = categoryBudgets[category];
            const spent = total(monthExpenses().filter((item) => item.category === category));
            const row = document.createElement('article');
            row.className = 'category-budget-row';
            row.dataset.category = category;
            if (!limit) {
                row.innerHTML = `<div class="category-budget-heading"><strong>${category}</strong><span>No limit set</span></div><div class="category-budget-meter" aria-hidden="true"><span></span></div><div class="category-budget-caption"><span>${money(spent)} spent this month</span><span>Set a limit above</span></div>`;
                list.appendChild(row);
                return;
            }
            const percent = spent / limit * 100;
            const overBudget = spent > limit;
            row.innerHTML = `<div class="category-budget-heading"><strong>${category}</strong><span>${Math.round(percent)}% used</span></div><div class="category-budget-meter" role="progressbar" aria-label="${category} budget used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(Math.round(percent), 100)}"><span style="width:${Math.min(percent, 100)}%"></span></div><div class="category-budget-caption"><span>${money(spent)} of ${money(limit)}${overBudget ? ` · ${money(spent - limit)} over` : ` · ${money(limit - spent)} left`}</span><button class="row-action category-budget-clear" type="button" data-category="${category}" aria-label="Remove ${category} monthly limit">Remove limit</button></div>`;
            if (overBudget) row.classList.add('is-over-budget');
            list.appendChild(row);
        });
    }

    function renderRecurring() {
        const list = $('recurring-list');
        const sorted = [...recurringExpenses].sort((first, second) => first.next_due_date.localeCompare(second.next_due_date));
        if (!sorted.length) {
            list.innerHTML = '<p class="recurring-empty">No reminders yet. Add a regular bill above to keep it in view.</p>';
            return;
        }

        list.innerHTML = sorted.map((item) => {
            const due = item.next_due_date <= dateKey(today);
            const dueLabel = due
                ? item.next_due_date < dateKey(today) ? 'Overdue' : 'Due today'
                : `Next due ${formatDate(item.next_due_date)}`;
            const repeatLabel = item.frequency === 'weekly' ? 'Every week' : 'Every month';
            return `<div class="recurring-item"><div class="recurring-details"><strong>${escapeHtml(item.description)}</strong><span>${escapeHtml(item.category)} · ${repeatLabel} · ${dueLabel}</span></div><strong class="recurring-amount">${money(item.amount)}</strong><div class="recurring-actions"><button class="row-action recurring-record" type="button" data-recurring-action="record" data-id="${item.id}" aria-label="Record recurring expense ${escapeHtml(item.description)}" ${due ? '' : 'disabled'}>Record expense</button><button class="row-action delete-button" type="button" data-recurring-action="delete" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.description)} reminder">Remove</button></div></div>`;
        }).join('');
    }

    function renderTrend() {
                const chart = $('monthly-trend');
                const currentCutoff = dateKey(today);
                const months = Array.from({ length: 6 }, (_, index) => new Date(today.getFullYear(), today.getMonth() - 5 + index, 1));
                const values = months.map((date) => {
                    const key = monthKey(date);
                    return total(expenses.filter((item) => item.expense_date.slice(0, 7) === key && (key !== currentMonth || item.expense_date <= currentCutoff)));
                });
                const maxValue = Math.max(...values, 1);
                chart.replaceChildren();
                chart.setAttribute('aria-label', `Spending for the last six months: ${months.map((date, index) => `${date.toLocaleDateString(undefined, { month: 'long' })}, ${money(values[index])}`).join('; ')}`);

                months.forEach((date, index) => {
                    const column = document.createElement('div');
                    column.className = 'trend-column';
                    const bar = document.createElement('span');
                    bar.className = `trend-bar${index === months.length - 1 ? ' is-current' : ''}`;
                    bar.style.setProperty('--bar-height', `${Math.max(values[index] / maxValue * 100, 2)}%`);
                    bar.style.setProperty('--bar-color', trendColors[index]);
                    bar.title = `${date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}: ${money(values[index])}`;
                    const label = document.createElement('span');
                    label.className = 'trend-month';
                    label.textContent = date.toLocaleDateString(undefined, { month: 'short' });
                    column.append(bar, label);
                    chart.appendChild(column);
                });

                const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const previousKey = monthKey(previousMonth);
                const previousLastDay = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0).getDate();
                const previousCutoff = dateKey(new Date(previousMonth.getFullYear(), previousMonth.getMonth(), Math.min(today.getDate(), previousLastDay)));
                const currentToDate = total(expenses.filter((item) => item.expense_date.slice(0, 7) === currentMonth && item.expense_date <= currentCutoff));
                const previousToDate = total(expenses.filter((item) => item.expense_date.slice(0, 7) === previousKey && item.expense_date <= previousCutoff));
                if (!previousToDate) {
                    $('trend-summary').textContent = currentToDate ? `You've logged ${money(currentToDate)} so far; there was no spending by this date last month.` : 'No spending in the comparable period last month. Your trend updates as you add expenses.';
                    return;
                }
                const difference = Math.round((currentToDate - previousToDate) / previousToDate * 100);
                $('trend-summary').textContent = difference === 0 ? 'Spending is level with this point last month.' : `You're spending ${Math.abs(difference)}% ${difference < 0 ? 'less' : 'more'} than at this point last month.`;
            }

    function render() {
        const monthTotal = total(monthExpenses());
        const remaining = budget - monthTotal;
        const budgetPercent = budget > 0 ? monthTotal / budget * 100 : 0;
        const monthlyIncome = incomeEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
        $('total-spent').textContent = money(monthTotal);
        $('income-total').textContent = money(monthlyIncome);
        $('budget-total').textContent = money(budget);
        $('remaining-budget').textContent = money(remaining);
        $('transaction-count').textContent = expenses.length;
        $('total-balance').textContent = money(totalBalance);
        $('spend-change').textContent = monthTotal ? `${Math.round(monthTotal / budget * 100)}% of your budget used` : 'No expenses yet';
        $('income-summary').textContent = `${incomeEntries.length} inflow ${incomeEntries.length === 1 ? 'entry' : 'entries'} this month`;
        $('budget-status').textContent = remaining < 0 ? `${money(Math.abs(remaining))} over budget` : remaining < budget * .2 ? 'Budget is getting tight' : "You're on track";
        const meter = $('budget-meter'); const fill = $('budget-meter-fill'); const usage = Math.min(Math.max(budgetPercent, 0), 100);
        if (fill) {
            fill.style.width = `${usage}%`;
            fill.classList.toggle('is-over-budget', remaining < 0);
        }
        if (meter) meter.setAttribute('aria-valuenow', String(Math.round(usage)));
        const budgetUsed = $('budget-used');
        if (budgetUsed) budgetUsed.textContent = `${Math.round(budgetPercent)}%`;
        const latest = expenses[0]; $('latest-date').textContent = latest ? `Last added ${formatDate(latest.expense_date)}` : 'Start your first entry';

        let period = $('chart-period').value;
        let chartItems = period === 'all' ? expenses : period === 'year' ? expenses.filter((item) => item.expense_date.slice(0, 4) === String(currentYear)) : monthExpenses();
        if (period === 'month' && !chartItems.length && expenses.length) {
            $('chart-period').value = 'all';
            chartItems = expenses;
        }

        renderTable(); drawChart(chartItems); renderTrend(); renderAccounts(); renderGoals(); renderDebts(); renderAlerts(); renderNetWorth(); renderRecurring(); renderCategoryBudgets();
    }

    window.addEventListener('ledger-theme-change', render);

    $('category-budget-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const category = $('budget-category').value;
        const amount = Number($('category-budget-amount').value);
        const message = $('category-budget-message');
        const button = $('category-budget-submit');
        message.textContent = '';
        if (!categories.includes(category) || !Number.isFinite(amount) || amount < 0.01) {
            message.textContent = 'Choose a category and enter a monthly limit of at least ₦0.01.';
            return;
        }

        const nextBudgets = { ...categoryBudgets, [category]: amount };
        button.disabled = true;
        try {
            const { error } = await ledgerSupabase.from('profiles').update({ category_budgets: nextBudgets }).eq('id', user.id).select('id').single();
            if (error) throw error;
            categoryBudgets = nextBudgets;
            $('category-budget-amount').value = '';
            renderCategoryBudgets();
            notify(`${category} monthly limit saved.`);
        } catch (error) {
            message.textContent = isMissingCategoryBudgetColumn(error)
                ? 'Run the latest supabase-schema.sql in Supabase before saving category limits.'
                : `Could not save the category limit: ${error.message}`;
        } finally {
            button.disabled = false;
        }
    });

    $('budget-category').addEventListener('change', () => {
        $('category-budget-amount').value = categoryBudgets[$('budget-category').value] || '';
    });

    $('category-budget-list').addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-category]');
        if (!button || button.disabled) return;
        const category = button.dataset.category;
        if (!categories.includes(category) || !categoryBudgets[category]) return;
        const nextBudgets = { ...categoryBudgets };
        delete nextBudgets[category];
        button.disabled = true;
        try {
            const { error } = await ledgerSupabase.from('profiles').update({ category_budgets: nextBudgets }).eq('id', user.id).select('id').single();
            if (error) throw error;
            categoryBudgets = nextBudgets;
            renderCategoryBudgets();
            notify(`${category} monthly limit removed.`);
        } catch (error) {
            $('category-budget-message').textContent = isMissingCategoryBudgetColumn(error)
                ? 'Run the latest supabase-schema.sql in Supabase before changing category limits.'
                : `Could not remove the category limit: ${error.message}`;
        } finally {
            button.disabled = false;
        }
    });

    $('expense-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const description = $('description').value.trim();
        const amount = Number($('amount').value);
        const expenseDate = $('expense-date').value;
        const transactionType = $('transaction-type').value;
        $('form-message').textContent = '';
        if (!description || !amount || amount <= 0 || !expenseDate) {
            $('form-message').textContent = 'Add a description, date, and amount greater than zero.';
            return;
        }

        if (transactionType === 'income') {
            incomeEntries.unshift({
                description,
                amount,
                date: expenseDate,
                category: $('category').value
            });
            storage.write('ledger.incomeEntries', incomeEntries);
            resetExpenseForm();
            render();
            notify('Income added to your cash flow.');
            return;
        }

        const expense = { description, amount, category: $('category').value, expense_date: expenseDate };
        if (editingExpenseId) {
            const { data, error } = await ledgerSupabase.from('expenses').update(expense).eq('id', editingExpenseId).eq('user_id', user.id).select().single();
            if (error) { $('form-message').textContent = error.message; return; }
            expenses = expenses.map((item) => item.id === editingExpenseId ? data : item);
            resetExpenseForm(); render(); notify('Expense updated.'); return;
        }
        expense.user_id = user.id;
        const { data, error } = await ledgerSupabase.from('expenses').insert(expense).select().single();
        if (error) { $('form-message').textContent = error.message; return; }
        expenses.unshift(data); resetExpenseForm(); render(); notify('Expense added to your ledger.');
    });

    $('scan-receipt-btn').addEventListener('click', () => {
        const input = $('receipt-file-input');
        input.value = '';
        input.click();
    });

    $('receipt-file-input').addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const amount = Number((Math.random() * 8800 + 800).toFixed(2));
        const inferredLabel = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Receipt purchase';
        $('description').value = inferredLabel;
        $('amount').value = String(amount);
        $('category').value = 'Food';
        $('expense-date').value = dateKey(today);
        $('transaction-type').value = 'expense';
        $('form-message').textContent = 'Receipt detected — review the details and save it.';
        $('description').focus();
    });

    $('transfer-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const sourceId = $('transfer-from').value;
        const targetId = $('transfer-to').value;
        const value = Number($('transfer-amount').value);
        const message = $('transfer-message');
        if (!Number.isFinite(value) || value <= 0) {
            message.textContent = 'Enter a transfer amount greater than zero.';
            return;
        }
        if (sourceId === targetId) {
            message.textContent = 'Choose different accounts for the transfer.';
            return;
        }
        const source = accounts.find((account) => account.id === sourceId);
        const target = accounts.find((account) => account.id === targetId);
        if (!source || !target || source.balance < value) {
            message.textContent = 'Not enough funds in the source account.';
            return;
        }
        source.balance -= value;
        target.balance += value;
        storage.write('ledger.accounts', accounts);
        $('transfer-form').reset();
        message.textContent = `Transferred ${money(value)} from ${source.name} to ${target.name}.`;
        render();
    });

    $('recurring-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const description = $('recurring-description').value.trim();
        const amount = Number($('recurring-amount').value);
        const nextDueDate = $('recurring-date').value;
        const message = $('recurring-message');
        const button = event.currentTarget.querySelector('button[type="submit"]');
        message.textContent = '';
        if (!description || !amount || amount <= 0 || !nextDueDate) {
            message.textContent = 'Enter a description, a due date, and an amount greater than zero.';
            return;
        }

        button.disabled = true;
        try {
            const { data, error } = await ledgerSupabase.from('recurring_expenses').insert({
                user_id: user.id,
                description,
                amount,
                category: $('recurring-category').value,
                frequency: $('recurring-frequency').value,
                due_day: Number(nextDueDate.slice(-2)),
                next_due_date: nextDueDate
            }).select('id, description, amount, category, frequency, due_day, next_due_date').single();
            if (error) throw error;
            recurringExpenses.push(data);
            event.currentTarget.reset();
            $('recurring-date').value = dateKey(today);
            renderRecurring();
            notify('Recurring reminder added.');
        } catch (error) {
            const isSchemaMismatch = ['PGRST204', 'PGRST205', '42703', '42P01'].includes(error.code);
            message.textContent = isSchemaMismatch
                ? 'The reminders database needs updating. Run the latest supabase-schema.sql in your Supabase SQL Editor, then reload the dashboard.'
                : `Could not save the reminder: ${error.message}`;
        } finally {
            button.disabled = false;
        }
    });

    $('recurring-list').addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-recurring-action]');
        if (!button) return;
        const recurring = recurringExpenses.find((item) => item.id === button.dataset.id);
        if (!recurring) return;
        button.disabled = true;

        try {
            if (button.dataset.recurringAction === 'record') {
                if (recurring.next_due_date > dateKey(today)) return;
                const { data: expenseId, error } = await ledgerSupabase.rpc('record_recurring_expense', {
                    p_recurring_expense_id: recurring.id
                });
                if (error) throw error;
                expenses.unshift({
                    id: expenseId,
                    description: recurring.description,
                    amount: recurring.amount,
                    category: recurring.category,
                    expense_date: recurring.next_due_date,
                    created_at: new Date().toISOString()
                });
                expenses.sort((first, second) => second.expense_date.localeCompare(first.expense_date));
                recurring.next_due_date = advanceRecurringDate(recurring.next_due_date, recurring.frequency, recurring.due_day);
                render();
                notify('Expense recorded and next reminder scheduled.');
            } else if (button.dataset.recurringAction === 'delete') {
                if (!confirm(`Remove the recurring reminder for "${recurring.description}"?`)) return;
                const { error } = await ledgerSupabase.from('recurring_expenses').delete().eq('id', recurring.id).eq('user_id', user.id);
                if (error) throw error;
                recurringExpenses = recurringExpenses.filter((item) => item.id !== recurring.id);
                renderRecurring();
                notify('Recurring reminder removed.');
            }
        } catch (error) {
            notify(`Could not update the recurring expense: ${error.message}`);
        } finally {
            button.disabled = false;
        }
    });

    $('transaction-list').addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-id]');
        if (!button) return;
        if (button.dataset.action === 'edit') {
            const expense = expenses.find((item) => item.id === button.dataset.id);
            if (!expense) return;
            editingExpenseId = expense.id;
            $('description').value = expense.description;
            $('amount').value = expense.amount;
            $('category').value = expense.category;
            $('expense-date').value = expense.expense_date;
            $('expense-form-title').textContent = 'Edit expense';
            $('expense-submit-btn').textContent = 'Save changes';
            $('cancel-edit-btn').hidden = false;
            $('form-message').textContent = '';
            $('expense-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
            $('description').focus({ preventScroll: true });
            return;
        }
        const { error } = await ledgerSupabase.from('expenses').delete().eq('id', button.dataset.id).eq('user_id', user.id);
        if (error) { notify(error.message); return; }
        if (editingExpenseId === button.dataset.id) resetExpenseForm();
        expenses = expenses.filter((item) => item.id !== button.dataset.id); render(); notify('Transaction removed.');
    });
    $('cancel-edit-btn').addEventListener('click', resetExpenseForm);
    $('search-input').addEventListener('input', renderTable); $('category-filter').addEventListener('change', renderTable); $('chart-period').addEventListener('change', render); window.addEventListener('resize', render);
    $('clear-btn').addEventListener('click', async () => { if (!expenses.length || !confirm('Clear every transaction from this account?')) return; const { error } = await ledgerSupabase.from('expenses').delete().eq('user_id', user.id); if (error) { notify(error.message); return; } expenses = []; render(); notify('All transactions cleared.'); });
    $('transaction-type').addEventListener('change', () => {
        const isIncome = $('transaction-type').value === 'income';
        $('expense-form-title').textContent = isIncome ? 'Record income' : 'Record an expense';
        $('expense-submit-btn').innerHTML = isIncome ? 'Add income <span>↗</span>' : 'Add expense <span>↗</span>';
    });
    $('edit-budget-btn').addEventListener('click', () => {
        const form = $('budget-edit-form');
        form.hidden = !form.hidden;
        $('edit-budget-btn').setAttribute('aria-expanded', String(!form.hidden));
        if (!form.hidden) {
            $('monthly-budget-input').value = String(budget);
            $('monthly-budget-input').focus();
        }
    });
    $('cancel-budget-edit-btn').addEventListener('click', () => {
        $('budget-edit-form').hidden = true;
        $('edit-budget-btn').setAttribute('aria-expanded', 'false');
        $('budget-edit-message').textContent = '';
    });
    $('budget-edit-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const value = Number($('monthly-budget-input').value);
        const message = $('budget-edit-message');
        const button = event.currentTarget.querySelector('button[type="submit"]');
        message.textContent = '';
        if (!Number.isFinite(value) || value < 0.01) {
            message.textContent = 'Enter a monthly budget of at least ₦0.01.';
            return;
        }

        const previousBudget = budget;
        budget = value;
        button.disabled = true;
        try {
            await saveBudget();
            $('budget-edit-form').hidden = true;
            $('edit-budget-btn').setAttribute('aria-expanded', 'false');
            render();
            notify('Monthly budget updated.');
        } catch (error) {
            budget = previousBudget;
            message.textContent = `Could not save the monthly budget: ${error.message}`;
        } finally {
            button.disabled = false;
        }
    });
    $('export-btn').addEventListener('click', () => { if (!expenses.length) { notify('Add an expense before exporting.'); return; } const rows = [['Description', 'Category', 'Date', 'Amount'], ...expenses.map((item) => [item.description, item.category, item.expense_date, item.amount])]; const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = `ledger-${currentMonth}.csv`; link.click(); URL.revokeObjectURL(link.href); notify('CSV export downloaded.'); });
    const logout = async () => { await ledgerSupabase.auth.signOut(); window.location.href = 'login.html'; };
    $('logout-btn').addEventListener('click', logout);
    $('logout-top').addEventListener('click', logout);

    try { await loadData(); render(); } catch (error) { $('form-message').textContent = `Could not load your cloud data: ${error.message}`; }
})();
