// Carrefour Israel (קרפור) gift card / credit voucher emails.
// Each field is a list of regexes; the first capture group of the first match wins.
export default {
  brand: 'קרפור',
  detect: /carrefour|קר[א]?פור/i,
  fields: {
    code: [
      /(?:מספר|קוד)\s*(?:ה)?(?:שובר|כרטיס|תו|גיפט\s*קארד)\s*[:：\-]?\s*([0-9][0-9 \-]{7,30}[0-9])/,
      /(?:card|voucher)\s*(?:number|no\.?|code)\s*[:\-]?\s*([0-9][0-9 \-]{7,30}[0-9])/i,
    ],
    pin: [/(?:קוד\s*(?:סודי|אימות)|pin|cvv)\s*[:\-]?\s*(\d{3,8})/i],
    amount: [
      /(?:סכום|שווי|ערך|בסך|טעינה)\s*(?:השובר|הכרטיס|של)?\s*[:\-]?\s*₪?\s*([\d,]+(?:\.\d{1,2})?)/,
      /₪\s*([\d,]+(?:\.\d{1,2})?)/,
    ],
    expiry: [/(?:בתוקף\s*עד|תוקף|תאריך\s*תפוגה|valid\s*until)\s*[:\-]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/i],
  },
}
