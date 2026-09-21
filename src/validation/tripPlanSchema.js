import * as Yup from 'yup'

const todayInputValue = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString().slice(0, 10)
}

export const tripBasicsSchema = Yup.object({
  departureDate: Yup.string()
    .required('Choose a departure date')
    .test('not-in-past', 'Departure date cannot be in the past', (value) => (
      !value || value >= todayInputValue()
    )),
  returnDate: Yup.string()
    .required('Choose a return date')
    .test('after-departure', 'Return date must be after departure', function validateReturn(value) {
      const { departureDate } = this.parent
      return !value || !departureDate || value > departureDate
    }),
  travelers: Yup.number()
    .integer('Travelers must be a whole number')
    .min(1, 'Add at least one traveler')
    .max(10, 'For this planner, use 10 travelers or fewer')
    .required('Choose the number of travelers'),
  budgetAmount: Yup.number()
    .typeError('Enter a budget amount')
    .min(500, 'Use at least 500 in the selected currency')
    .max(100000000, 'Enter a realistic budget amount')
    .required('Enter an approximate budget'),
  homeCurrency: Yup.string().required('Choose your home currency'),
  tripStyles: Yup.array()
    .of(Yup.string())
    .min(1, 'Choose at least one trip style')
    .max(5, 'Choose up to five trip styles'),
  preferredRegions: Yup.string().max(160, 'Keep destinations under 160 characters'),
  notes: Yup.string().max(500, 'Keep notes under 500 characters'),
})

export const todayForDateInput = todayInputValue
