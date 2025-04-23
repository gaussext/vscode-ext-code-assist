export class SimpleIDB {
  dbName = "";
  storeName = "";
  version = 1;
  db: IDBDatabase | null = null;
    
  constructor({ dbName = '', storeName = '', version = 1 }) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
    this.db = null;
  }

  // 初始化数据库连接
  connect(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result as IDBDatabase;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as any).result as IDBDatabase;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as any).error);
      };
    });
  }

  // 创建/更新数据
  set(data: any) {
    return this.connect().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve({});
        request.onerror = (event) => reject((event.target as any).error);
      });
    });
  }

  // 获取数据
  get(id: string) {
    return this.connect().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject((event.target as any).error);
      });
    });
  }
  
  // 删除数据库 (用于测试/清理)
  static deleteDatabase(dbName: string) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve({});
      request.onerror = (event) => reject((event.target as any).error);
    });
  }
}
