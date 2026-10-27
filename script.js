async function initializeLedgerDashboard() {
    const ledgerSupabase = window.ledgerSupabase;
    const { data: { user }, error: sessionError } = await ledgerSupabase.auth.getUser();
    if (sessionError || !user) { window.location.href = '/login'; return; }

    const categories = ['Food', 'Bills', 'Transport', 'Shopping', 'Fun', 'Other'];
    const colors = {
        Food: '#e58b46',
        Bills: '#6676c9',
        Transport: '#319b91',
        Shopping: '#d46683',
        Fun: '#c39a32',
        Other: '#82909d'
    };

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
        categories.forEach((name, index) => { if (!totals[index]) return; const next = angle + totals[index] / sum * Math.PI * 2; context.beginPath(); context.moveTo(center, center); context.arc(center, center, radius, angle, next); context.closePath(); context.fillStyle = colors[name]; context.fill(); context.strokeStyle = '#ffffff'; context.lineWidth = 2; context.stroke(); angle = next; const legendItem = document.createElement('span'); legendItem.className = 'legend-item'; const dot = document.createElement('i'); dot.className = 'legend-dot'; dot.style.backgroundColor = colors[name]; legendItem.append(dot, document.createTextNode(`${name} ${Math.round(totals[index] / sum * 100)}%`)); $('chart-legend').appendChild(legendItem); });
        context.beginPath(); context.arc(center, center, radius * .54, 0, Math.PI * 2); context.fillStyle = '#ffffff'; context.fill(); context.fillStyle = '#18221c'; context.font = '700 13px "Sora", Arial, sans-serif'; context.textAlign = 'center'; context.fillText(money(sum), center, center + 4);
    }

    function renderTable() {
        const query = $('search-input').value.trim().toLowerCase(); const filter = $('category-filter').value;
        const visible = expenses.filter((item) => item.description.toLowerCase().includes(query) && (filter === 'All' || item.category === filter));
        $('transaction-list').innerHTML = visible.map((item) => `<tr><td>${escapeHtml(item.description)}</td><td><span class="category-tag" data-category="${escapeHtml(item.category)}">${escapeHtml(item.category)}</span></td><td>${formatDate(item.expense_date)}</td><td>${money(item.amount)}</td><td><div class="transaction-actions"><button class="row-action edit-button" type="button" data-action="edit" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.description)}">Edit</button><button class="row-action delete-button" type="button" data-action="delete" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.description)}">×</button></div></td></tr>`).join('');
        $('empty-state').hidden = visible.length > 0; $('transaction-summary').textContent = `Showing ${visible.length} of ${expenses.length} transaction${expenses.length === 1 ? '' : 's'}`;
    }

    function renderRecurring() {
        const list = $('recurring-list');
        const sorted = [...recurringExpenses].sort((first, second) => first.next_due_date.localeCompare(second.next_due_date));
        if (!sorted.length) {
            list.innerHTML = '<p class="recurring-empty">No reminders yet. Add a regular bill above to keep it in view.</p>';
            return;
        }

        function renderCategoryBudgets() {
            const list = $('category-budget-list');
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
        const monthTotal = total(monthExpenses()); const remaining = budget - monthTotal; const budgetPercent = budget > 0 ? monthTotal / budget * 100 : 0; $('total-spent').textContent = money(monthTotal); $('budget-total').textContent = money(budget); $('remaining-budget').textContent = money(remaining); $('transaction-count').textContent = expenses.length;
        $('spend-change').textContent = monthTotal ? `${Math.round(monthTotal / budget * 100)}% of your budget used` : 'No expenses yet'; $('budget-status').textContent = remaining < 0 ? `${money(Math.abs(remaining))} over budget` : remaining < budget * .2 ? 'Budget is getting tight' : "You're on track";
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

        renderTable(); drawChart(chartItems); renderTrend(); renderRecurring(); renderCategoryBudgets();
    }

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
        event.preventDefault(); const description = $('description').value.trim(); const amount = Number($('amount').value); const expenseDate = $('expense-date').value; $('form-message').textContent = '';
        if (!description || !amount || amount <= 0 || !expenseDate) { $('form-message').textContent = 'Add a description, date, and amount greater than zero.'; return; }
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
    const logout = async () => { await ledgerSupabase.auth.signOut(); window.location.href = '/login'; };
    $('logout-btn').addEventListener('click', logout);
    $('logout-top').addEventListener('click', logout);

    try { await loadData(); render(); } catch (error) { $('form-message').textContent = `Could not load your cloud data: ${error.message}`; }
}

if (typeof window !== 'undefined') window.initializeLedgerDashboard = initializeLedgerDashboard;
