import { render } from '@testing-library/react'
import { beforeEach, afterEach, expect, test } from '@jest/globals'
import { useEffect } from 'react'
import { AppProvider, useApp } from '../lib/app-context'

function AddNotification() {
  const { actions } = useApp()
  useEffect(() => {
    actions.addNotification({ type: 'info', title: 't', message: 'm' })
  }, [actions])
  return null
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

test('cleanup clears pending timeouts on unmount', () => {
  const { unmount } = render(
    <AppProvider>
      <AddNotification />
    </AppProvider>
  )

  expect(jest.getTimerCount()).toBeGreaterThan(0)
  unmount()
  expect(jest.getTimerCount()).toBe(0)
})
