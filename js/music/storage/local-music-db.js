// ==========================================================================
// PERSONAL-WORKSPACE — LOCAL MUSIC STORAGE (LOCAL-MUSIC-DB.JS)
// Menggunakan IndexedDB untuk menyimpan file MP3/Audio lokal dan lirik
// ==========================================================================

class LocalMusicDB {
    constructor() {
        this.dbName = 'PersonalWorkspaceLocalMusic';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('[local-music-db] IndexedDB error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('tracks')) {
                    // id is string (unique timestamp or hash)
                    const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
                    trackStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('lyrics')) {
                    const lyricsStore = db.createObjectStore('lyrics', { keyPath: 'trackId' });
                }
            };
        });
    }

    async addTrack(trackObject) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const request = store.add(trackObject);

            request.onsuccess = () => resolve(trackObject);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async updateTrack(trackObject) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const request = store.put(trackObject);

            request.onsuccess = () => resolve(trackObject);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async getTrack(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async getAllTracks() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const index = store.index('createdAt');
            const request = index.openCursor(null, 'prev'); // descending

            const tracks = [];
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    tracks.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(tracks);
                }
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async deleteTrack(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks', 'lyrics'], 'readwrite');
            
            const trackStore = transaction.objectStore('tracks');
            trackStore.delete(id);
            
            const lyricsStore = transaction.objectStore('lyrics');
            lyricsStore.delete(id);

            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    async clearTracks() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks', 'lyrics'], 'readwrite');
            transaction.objectStore('tracks').clear();
            transaction.objectStore('lyrics').clear();
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    // --- Lyrics Methods ---

    async saveLyrics(trackId, lrcText) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['lyrics'], 'readwrite');
            const store = transaction.objectStore('lyrics');
            const request = store.put({ trackId, lrcText });

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async getLyrics(trackId) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['lyrics'], 'readonly');
            const store = transaction.objectStore('lyrics');
            const request = store.get(trackId);

            request.onsuccess = () => resolve(request.result ? request.result.lrcText : null);
            request.onerror = (e) => reject(e.target.error);
        });
    }
}

window.localMusicDB = new LocalMusicDB();
