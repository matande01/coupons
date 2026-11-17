// Sample emails for Voucher Catcher. Run: npx vite-node scripts/test-catch.mjs
// Add a real (redacted) email here when you add a provider, with the values you expect.
import { catchVoucher } from '../src/lib/catch'

const TODAY = '2026-11-17'
const SAMPLES = [
  {
    name: 'Carrefour',
    text: `שלום דנה,
קיבלת גיפט קארד של קרפור!
מספר השובר: 7290 0123 4567 89
קוד סודי: 4821
סכום השובר: 250 ₪
בתוקף עד 31/12/2031
לשאלות: שירות לקוחות 1-700-700-123`,
    expect: { brand: 'קרפור', code: '72900123456789', pin: '4821', amount: 250, expiry: '2031-12-31' },
  },
  {
    name: 'Terminal X (HTML)',
    text: `<html><body><h1>TERMINAL X</h1><p>Your Gift Card is here 🎁</p>
<table><tr><td>Gift card code:</td><td>TX-9F3K-22LM</td></tr>
<tr><td>ערך:</td><td>&#8362;150.00</td></tr>
<tr><td>בתוקף עד:</td><td>15.03.2030</td></tr></table>
<p>הוזמן בתאריך 10.03.2025, הזמנה 102938475</p></body></html>`,
    expect: { brand: 'Terminal X', code: 'TX9F3K22LM', amount: 150, expiry: '2030-03-15' },
  },
  {
    name: 'Dream Card',
    text: `Dream Card - המתנה שלך הגיעה
מספר כרטיס: 5326-1100-2233-4455
CVV: 123
טעינה: 300 ש"ח
התוקף: 5 שנים מיום הטעינה`,
    expect: { brand: 'דרים קארד', code: '5326110022334455', pin: '123', amount: 300, expiry: '2031-11-17' },
  },
  {
    name: 'Tav Plus',
    text: `תו פלוס | קיבלת תו מתנה
קוד התו: 8800 4455 6677
שווי: ₪200
בתוקף עד 01/06/2030`,
    expect: { brand: 'תו פלוס', code: '880044556677', amount: 200, expiry: '2030-06-01' },
  },
  {
    name: 'Katsefet',
    text: `קצפת - שובר מתנה
קוד שובר: KZ77Q19
בסך 100 ₪, תוקף: 20/08/2028`,
    expect: { brand: 'קצפת', code: 'KZ77Q19', amount: 100, expiry: '2028-08-20' },
  },
  {
    name: 'Unknown brand (generic fallback)',
    text: `שובר מתנה של רנואר
קוד: RN-55120
סכום: 120 ₪
בתוקף עד 1.1.2029`,
    expect: { brand: 'רנואר', code: 'RN-55120', amount: 120, expiry: '2029-01-01' },
  },
]

let fail = 0
for (const s of SAMPLES) {
  const got = catchVoucher(s.text, TODAY)
  const bad = Object.entries(s.expect).filter(([k, v]) => got[k] !== v)
  if (bad.length) fail++
  console.log(bad.length ? '✗' : '✓', s.name, bad.length ? bad.map(([k, v]) => `${k}: got ${JSON.stringify(got[k])}, want ${JSON.stringify(v)}`).join(' · ') : '')
}
process.exit(fail ? 1 : 0)
