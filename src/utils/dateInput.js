export const toLocalDateInputValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const parseLocalDateInput = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return null

  const [, year, month, day] = match.map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return null
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

export const addDaysToDateInput = (value, amount) => {
  const date = value instanceof Date
    ? new Date(value.getTime())
    : parseLocalDateInput(value)

  if (!date) return ''
  date.setDate(date.getDate() + Number(amount || 0))
  return toLocalDateInputValue(date)
}
