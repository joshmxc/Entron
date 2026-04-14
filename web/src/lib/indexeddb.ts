import { openDB, DBSchema, IDBPDatabase } from "idb";

interface EntronDB extends DBSchema {
  offline_scans: {
    key: number;
    value: {
      qrCode: string;
      eventId: string;
      timestamp: string;
      deviceId: string;
    };
    autoIncrement: true;
  };
}

let db: IDBPDatabase<EntronDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<EntronDB>> {
  if (!db) {
    db = await openDB<EntronDB>("entron-offline", 1, {
      upgrade(database) {
        database.createObjectStore("offline_scans", { autoIncrement: true });
      },
    });
  }
  return db;
}

export async function queueOfflineScan(data: {
  qrCode: string;
  eventId: string;
  timestamp: string;
  deviceId: string;
}): Promise<void> {
  const database = await getDB();
  await database.add("offline_scans", data);
}

export async function getOfflineScans() {
  const database = await getDB();
  const keys = await database.getAllKeys("offline_scans");
  const values = await database.getAll("offline_scans");
  return keys.map((key, i) => ({ key, ...values[i] }));
}

export async function deleteOfflineScan(key: number): Promise<void> {
  const database = await getDB();
  await database.delete("offline_scans", key);
}

export async function clearOfflineScans(): Promise<void> {
  const database = await getDB();
  await database.clear("offline_scans");
}
