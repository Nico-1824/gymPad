import { describe, it, expect, beforeEach } from 'vitest'
import { clearAppStorage } from '@/util/appStorage'

describe('clearAppStorage', () => {
    beforeEach(() => localStorage.clear())

    it('removes every gympad key and leaves other keys alone', () => {
        localStorage.setItem('gympad:done:7:2026-11-28', '{"1":2}')
        localStorage.setItem('gympad:rest-timer', '{}')
        localStorage.setItem('sb-project-auth-token', 'session')
        localStorage.setItem('unrelated', 'keep')

        clearAppStorage()

        expect(Object.keys(localStorage).sort()).toEqual(['sb-project-auth-token', 'unrelated'])
    })
})
