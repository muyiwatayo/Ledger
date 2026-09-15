(async () => {
    const { data: { user }, error: sessionError } = await ledgerSupabase.auth.getUser();
    if (sessionError || !user) { window.location.href = 'login.html'; return; }

    const categories = ['Food', 'Bills', 'Transport', 'Shopping', 'Fun', 'Other'];
    const colors = ['#49b66a', '#1d6838', '#98d7a7', '#27553a', '#b4dfbd', '#8b9a8d'];
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const currentYear = today.getFullYear();
    const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
    let expenses = [];
    let budget = 250000;
    const $ = (id) => document.getElementById(id);
    const money = (value) => `₦${Number(value).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
    const monthExpenses = () => expenses.filter((item) => item.expense_date.slice(0, 7) === currentMonth);
    const total = (items) => items.reduce((sum, item) => sum + Number(item.amount), 0);
    const formatDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
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
        const [profileResult, expenseResult] = await Promise.all([
            ledgerSupabase.from('profiles').select('display_name, monthly_budget, created_at').eq('id', user.id).single(),
            ledgerSupabase.from('expenses').select('id, description, amount, category, expense_date, created_at').eq('user_id', user.id).order('expense_date', { ascending: false })
        ]);
        if (expenseResult.error) throw expenseResult.error;
        expenses = expenseResult.data || [];
        if (!profileResult.error && profileResult.data) {
            budget = Number(profileResult.data.monthly_budget) || budget;
            const displayName = profileResult.data.display_name || user.user_metadata?.full_name || user.email || 'there';
            $('user-display-name').textContent = displayName;
            $('profile-name').textContent = displayName;
            $('profile-initial').textContent = displayName.charAt(0).toUpperCase();
            setProfilePhoto(displayName);
            $('user-joined-date').textContent = new Date(profileResult.data.created_at).toLocaleDateString();
        } else {
            const displayName = user.user_metadata?.full_name || user.email || 'there';
            $('user-display-name').textContent = displayName;
            $('profile-name').textContent = displayName;
            $('profile-initial').textContent = displayName.charAt(0).toUpperCase();
            setProfilePhoto(displayName);
        }
    }

    $('current-month').textContent = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    document.querySelector('.topbar h1').firstChild.textContent = `${greeting}, `;
    $('expense-date').value = today.toISOString().slice(0, 10);

    function notify(message) {
        const toast = $('toast'); toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
    }

    async function saveBudget() {
        const { error } = await ledgerSupabase.from('profiles').update({ monthly_budget: budget }).eq('id', user.id);
        if (error) throw error;
    }

    function drawChart(items) {
        const canvas = $('expenseChart'); const context = canvas.getContext('2d'); const size = Math.min(canvas.parentElement.clientWidth || 260, 225); const ratio = window.devicePixelRatio || 1;
        canvas.width = size * ratio; canvas.height = size * ratio; context.scale(ratio, ratio); context.clearRect(0, 0, size, size);
        const totals = categories.map((name) => total(items.filter((item) => item.category === name))); const sum = totals.reduce((result, value) => result + value, 0);
        $('chart-empty').hidden = sum > 0; $('chart-legend').innerHTML = ''; if (!sum) return;
        let angle = -Math.PI / 2; const center = size / 2; const radius = size * .37;
        categories.forEach((name, index) => { if (!totals[index]) return; const next = angle + totals[index] / sum * Math.PI * 2; context.beginPath(); context.moveTo(center, center); context.arc(center, center, radius, angle, next); context.closePath(); context.fillStyle = colors[index]; context.fill(); angle = next; const legendItem = document.createElement('span'); legendItem.className = 'legend-item'; legendItem.innerHTML = `<i class="legend-dot" style="background:${colors[index]}"></i>${name} ${Math.round(totals[index] / sum * 100)}%`; $('chart-legend').appendChild(legendItem); });
        context.beginPath(); context.arc(center, center, radius * .54, 0, Math.PI * 2); context.fillStyle = '#ffffff'; context.fill(); context.fillStyle = '#18221c'; context.font = '700 13px "Sora", Arial, sans-serif'; context.textAlign = 'center'; context.fillText(money(sum), center, center + 4);
    }

    function renderTable() {
        const query = $('search-input').value.trim().toLowerCase(); const filter = $('category-filter').value;
        const visible = expenses.filter((item) => item.description.toLowerCase().includes(query) && (filter === 'All' || item.category === filter));
        $('transaction-list').innerHTML = visible.map((item) => `<tr><td>${escapeHtml(item.description)}</td><td><span class="category-tag">${escapeHtml(item.category)}</span></td><td>${formatDate(item.expense_date)}</td><td>${money(item.amount)}</td><td><button class="delete-button" type="button" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.description)}">×</button></td></tr>`).join('');
        $('empty-state').hidden = visible.length > 0; $('transaction-summary').textContent = `Showing ${visible.length} of ${expenses.length} transaction${expenses.length === 1 ? '' : 's'}`;
    }

    function render() {
        const monthTotal = total(monthExpenses()); const remaining = budget - monthTotal; $('total-spent').textContent = money(monthTotal); $('budget-total').textContent = money(budget); $('remaining-budget').textContent = money(Math.max(remaining, 0)); $('transaction-count').textContent = expenses.length;
        $('spend-change').textContent = monthTotal ? `${Math.round(monthTotal / budget * 100)}% of your budget used` : 'No expenses yet'; $('budget-status').textContent = remaining < 0 ? `${money(Math.abs(remaining))} over budget` : remaining < budget * .2 ? 'Budget is getting tight' : "You're on track";
        const latest = expenses[0]; $('latest-date').textContent = latest ? `Last added ${formatDate(latest.expense_date)}` : 'Start your first entry'; const period = $('chart-period').value; const chartItems = period === 'all' ? expenses : period === 'year' ? expenses.filter((item) => item.expense_date.slice(0, 4) === String(currentYear)) : monthExpenses();
        renderTable(); drawChart(chartItems);
    }

    $('expense-form').addEventListener('submit', async (event) => {
        event.preventDefault(); const description = $('description').value.trim(); const amount = Number($('amount').value); const expenseDate = $('expense-date').value; $('form-message').textContent = '';
        if (!description || !amount || amount <= 0 || !expenseDate) { $('form-message').textContent = 'Add a description, date, and amount greater than zero.'; return; }
        const expense = { user_id: user.id, description, amount, category: $('category').value, expense_date: expenseDate };
        const { data, error } = await ledgerSupabase.from('expenses').insert(expense).select().single();
        if (error) { $('form-message').textContent = error.message; return; }
        expenses.unshift(data); event.target.reset(); $('expense-date').value = today.toISOString().slice(0, 10); render(); notify('Expense added to your ledger.');
    });

    $('transaction-list').addEventListener('click', async (event) => { const button = event.target.closest('[data-id]'); if (!button) return; const { error } = await ledgerSupabase.from('expenses').delete().eq('id', button.dataset.id).eq('user_id', user.id); if (error) { notify(error.message); return; } expenses = expenses.filter((item) => item.id !== button.dataset.id); render(); notify('Transaction removed.'); });
    $('search-input').addEventListener('input', renderTable); $('category-filter').addEventListener('change', renderTable); $('chart-period').addEventListener('change', render); window.addEventListener('resize', render);
    $('clear-btn').addEventListener('click', async () => { if (!expenses.length || !confirm('Clear every transaction from this account?')) return; const { error } = await ledgerSupabase.from('expenses').delete().eq('user_id', user.id); if (error) { notify(error.message); return; } expenses = []; render(); notify('All transactions cleared.'); });
    $('edit-budget-btn').addEventListener('click', async () => { const value = Number(prompt('Set your monthly budget in Naira:', budget)); if (!value || value <= 0) { notify('Enter a budget greater than zero.'); return; } budget = value; try { await saveBudget(); render(); notify('Monthly budget updated.'); } catch (error) { notify(error.message); } });
    $('export-btn').addEventListener('click', () => { if (!expenses.length) { notify('Add an expense before exporting.'); return; } const rows = [['Description', 'Category', 'Date', 'Amount'], ...expenses.map((item) => [item.description, item.category, item.expense_date, item.amount])]; const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = `ledger-${currentMonth}.csv`; link.click(); URL.revokeObjectURL(link.href); notify('CSV export downloaded.'); });
    $('logout-btn').addEventListener('click', async () => { await ledgerSupabase.auth.signOut(); window.location.href = 'login.html'; });

    try { await loadData(); render(); } catch (error) { $('form-message').textContent = `Could not load your cloud data: ${error.message}`; }
})();
