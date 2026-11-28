import { readonly, ref } from 'vue'
import { DEFAULT_PREFERENCES, getPreferences, savePreferences } from '@/api/preferences'
import type { Preferences } from '@/types/preferences'

const preferences = ref<Preferences>({ ...DEFAULT_PREFERENCES })

async function loadFromDatabase() {
    try {
        preferences.value = (await getPreferences()) ?? { ...DEFAULT_PREFERENCES }
    } catch {
        return
    }
}

function resetToDefaults() {
    preferences.value = { ...DEFAULT_PREFERENCES }
}

async function update(changes: Partial<Preferences>) {
    const previous = preferences.value
    preferences.value = { ...previous, ...changes }
    try {
        await savePreferences(changes)
    } catch (err) {
        preferences.value = previous
        throw err
    }
}

export function usePreferences() {
    return { preferences: readonly(preferences), loadFromDatabase, resetToDefaults, update }
}
