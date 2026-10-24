const BELOW_TWENTY = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
]

const SCALES = ['', 'Thousand', 'Million', 'Billion']

function chunkToWords(n) {
  let out = ''
  const hundred = Math.floor(n / 100)
  const rest = n % 100
  if (hundred > 0) {
    out += `${BELOW_TWENTY[hundred]} Hundred`
    if (rest > 0) out += ' '
  }
  if (rest > 0) {
    if (rest < 20) out += BELOW_TWENTY[rest]
    else {
      const ten = Math.floor(rest / 10)
      const unit = rest % 10
      out += TENS[ten]
      if (unit > 0) out += `-${BELOW_TWENTY[unit].toLowerCase()}`
    }
  }
  return out.trim()
}

function integerToWords(n) {
  if (n === 0) return 'Zero'
  let words = ''
  let scale = 0
  while (n > 0) {
    const chunk = n % 1000
    if (chunk > 0) {
      const chunkWords = chunkToWords(chunk)
      const scaleWord = SCALES[scale]
      const part = scaleWord ? `${chunkWords} ${scaleWord}` : chunkWords
      words = words ? `${part} ${words}` : part
    }
    n = Math.floor(n / 1000)
    scale += 1
  }
  return words
}

/** English amount in words for PKR invoices (e.g. "Twelve Thousand Five Hundred Only"). */
export function amountInWords(amount) {
  const n = Math.max(0, Number(amount) || 0)
  const rupees = Math.floor(n)
  const paisa = Math.round((n - rupees) * 100)

  let words = integerToWords(rupees)
  if (paisa > 0) {
    words += ` and ${integerToWords(paisa)} Paisa`
  }
  return `${words} Only`
}

export function formatAmountInWords(amount) {
  return `PKR ${amountInWords(amount)}`
}
