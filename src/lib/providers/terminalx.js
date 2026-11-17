// Terminal X (טרמינל איקס) gift card emails. Codes are often alphanumeric.
export default {
  brand: 'Terminal X',
  detect: /terminal\s*x|terminalx|טרמינל\s*איקס/i,
  fields: {
    code: [
      /(?:gift\s*card|קוד\s*(?:ה)?(?:גיפט\s*קארד|כרטיס|שובר|קופון)|קוד\s*מימוש)\s*(?:code|number)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-]{5,30})/i,
    ],
    pin: [/(?:pin|קוד\s*סודי)\s*[:\-]?\s*(\d{3,8})/i],
    amount: [
      /(?:סכום|שווי|ערך|יתרה|amount|value)\s*[:\-]?\s*₪?\s*([\d,]+(?:\.\d{1,2})?)/i,
      /₪\s*([\d,]+(?:\.\d{1,2})?)/,
    ],
    expiry: [/(?:בתוקף\s*עד|תוקף|expires?|valid\s*(?:until|thru))\s*[:\-]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/i],
  },
}
