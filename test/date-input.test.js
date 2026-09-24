import test from 'node:test'
import assert from 'node:assert/strict'
import { addDaysToDateInput, parseLocalDateInput, toLocalDateInputValue } from '../src/utils/dateInput.js'

test('date input formatting uses local calendar fields instead of UTC ISO slicing', () => {
  const localDate = new Date(2026, 8, 22, 0, 15, 0)
  assert.equal(toLocalDateInputValue(localDate), '2026-09-22')
})

test('date input helpers preserve date-only values across month boundaries', () => {
  assert.equal(addDaysToDateInput('2026-10-31', 1), '2026-11-01')
  assert.equal(addDaysToDateInput('2026-12-31', 1), '2027-01-01')
})

test('date input parser rejects malformed values', () => {
  assert.equal(parseLocalDateInput('not-a-date'), null)
  assert.equal(parseLocalDateInput('2026-02-31'), null)
  assert.equal(toLocalDateInputValue('not-a-date'), '')
})
