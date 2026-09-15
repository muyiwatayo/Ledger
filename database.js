const LedgerDatabase = (() => {
    const databaseName = 'ledger-database';
    const databaseVersion = 1;
    const accountStore = 'accounts';
    const expenseStore = 'expenses';

    function open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(databaseName, databaseVersion);
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(accountStore)) database.createObjectStore(accountStore, { keyPath: 'username' });
                if (!database.objectStoreNames.contains(expenseStore)) {
                    const expenses = database.createObjectStore(expenseStore, { keyPath: 'id' });
                    expenses.createIndex('username', 'username', { unique: false });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function run(storeName, mode, action) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = action(store);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            transaction.oncomplete = () => database.close();
        });
    }

    return {
        getAccount: (username) => run(accountStore, 'readonly', (store) => store.get(username)),
        saveAccount: (account) => run(accountStore, 'readwrite', (store) => store.put(account)),
        getExpenses: async (username) => {
            const database = await open();
            return new Promise((resolve, reject) => {
                const transaction = database.transaction(expenseStore, 'readonly');
                const request = transaction.objectStore(expenseStore).index('username').getAll(username);
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
                transaction.oncomplete = () => database.close();
            });
        },
        saveExpense: (expense) => run(expenseStore, 'readwrite', (store) => store.put(expense)),
        deleteExpense: (id) => run(expenseStore, 'readwrite', (store) => store.delete(id)),
        clearExpenses: async (username) => {
            const expenses = await LedgerDatabase.getExpenses(username);
            await Promise.all(expenses.map((expense) => LedgerDatabase.deleteExpense(expense.id)));
        }
    };
})();
