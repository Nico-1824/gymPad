export const APP_STORAGE_PREFIX = 'gympad:'

export function clearAppStorage() {
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith(APP_STORAGE_PREFIX)) localStorage.removeItem(key)
    }
}
