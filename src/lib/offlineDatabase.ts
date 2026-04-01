import { openDB } from 'idb';

const DB_NAME = 'master_fees_offline_db';
const DB_VERSION = 3;

export interface TransactionQueueEntry {
    id?: string;
    data: any;
    timestamp: string;
    retryCount: number;
}

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Schools Cache
            if (!db.objectStoreNames.contains('schools')) {
                db.createObjectStore('schools', { keyPath: 'id' });
            }
            // Payment History Cache
            if (!db.objectStoreNames.contains('payment_history')) {
                db.createObjectStore('payment_history', { keyPath: 'id' });
            }
            // Student Search Cache
            if (!db.objectStoreNames.contains('students')) {
                db.createObjectStore('students', { keyPath: 'id' });
            }
            // Transaction Queue
            if (!db.objectStoreNames.contains('transaction_queue')) {
                db.createObjectStore('transaction_queue', { keyPath: 'reference' });
            }
        },
    });
};

export const offlineDB = {
    async getAll(store: string) {
        const db = await initDB();
        return db.getAll(store);
    },
    async put(store: string, item: any) {
        const db = await initDB();
        return db.put(store, item);
    },
    async putAll(store: string, items: any[]) {
        const db = await initDB();
        // Use independent auto-transactions per record so one bad key
        // cannot abort the entire batch (shared tx.done would propagate the error).
        await Promise.all(
            items.map(item =>
                db.put(store, item).catch(() => {
                    // Silently skip records that fail to cache
                })
            )
        );
    },
    async delete(store: string, key: string) {
        const db = await initDB();
        return db.delete(store, key);
    }
};
