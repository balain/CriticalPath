/* addBusinessDays
 *
 * Returns a new Date that is `dplus` business days after `date`.
 * If `date` falls on a weekend it is silently (or noisily) advanced to Monday first.
 */
function addBusinessDays(date, dplus, adjustSilently = false) {
  const d = new Date(date)

  if (d.getDay() === 0) {
    if (!adjustSilently) {
      console.error(
        `Error: invalid day of week: ${d.getDay()}; expected value between 1 and 5, inclusive. Forcing to next business day`
      )
    }
    d.setDate(d.getDate() + 1)
  } else if (d.getDay() === 6) {
    if (!adjustSilently) {
      console.error(
        `Error: invalid day of week: ${d.getDay()}; expected value between 1 and 5, inclusive. Forcing to next business day`
      )
    }
    d.setDate(d.getDate() + 2)
  }

  const d2we = 6 - d.getDay()
  const d2m = d2we + 2
  let daystoadd = dplus

  if (dplus >= d2we) {
    daystoadd =
      d2m - 1 + (dplus - (d2we - 1)) + Math.floor((dplus - d2we) / 5) * 2
  }

  d.setDate(d.getDate() + daystoadd)

  if (d.getDay() === 0 || d.getDay() === 6) {
    throw new Error(
      `Error: invalid result day of week: ${d.getDay()}; Value must be between 1 and 5, inclusive.`
    )
  }

  return d
}

/* workingDaysBetween
 *
 * Returns the number of working days between fromDate and toDate.
 * Same-day returns 0. Returns -1 for invalid or reversed input.
 *
 * Source: https://mygeekjourney.com/programming-notes/javascript-how-to-calculate-number-of-working-days/
 */
function workingDaysBetween(fromDate, toDate) {
  const frD = new Date(fromDate)
  const toD = new Date(toDate)

  frD.setHours(0, 0, 0, 0)
  toD.setHours(0, 0, 0, 0)

  if (!fromDate || isNaN(frD) || !toDate || isNaN(toD) || toD < frD) {
    return -1
  }

  let numOfWorkingDays = 0

  while (frD < toD) {
    frD.setDate(frD.getDate() + 1)
    const day = frD.getDay()
    if (day !== 0 && day !== 6) {
      numOfWorkingDays++
    }
  }

  return numOfWorkingDays
}

/* workingDaysFromNow
 *
 * Returns the number of working days from today to toDate.
 * Returns -1 if toDate is in the past or invalid.
 */
function workingDaysFromNow(toDate) {
  const to = toDate instanceof Date ? toDate : new Date(toDate)
  return workingDaysBetween(new Date(), to)
}

module.exports = { addBusinessDays, workingDaysBetween, workingDaysFromNow }
