import Dexie from 'dexie'

// Local database (IndexedDB in the browser). Nothing leaves the device.
// Coupon record:
// { id, brand, code, pin, amount, balance, expiry ('YYYY-MM-DD' | ''), notes,
//   image (Blob | null), history: [{ id, date, amount, balanceAfter, note }],
//   createdAt, updatedAt }
export const db = new Dexie('coupons-db')

db.version(1).stores({
  coupons: '++id, brand, expiry, createdAt',
})

// Ask the browser not to evict our data under storage pressure (best effort).
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist()
    }
  } catch {
    /* not supported – ignore */
  }
}
