// Known brands with the spellings that tend to appear on coupons (Hebrew + English).
// `name` is what gets saved. Add your own brands here.
export const BRANDS = [
  { name: 'קרפור', aliases: ['carrefour', 'קרפור', 'קארפור'] },
  { name: 'Wolt', aliases: ['wolt', 'וולט'] },
  { name: 'רבר', aliases: ['rebar', 'רבר'] },
  { name: 'קסטרו', aliases: ['castro', 'קסטרו'] },
  { name: 'שופרסל', aliases: ['shufersal', 'שופרסל'] },
  { name: 'רמי לוי', aliases: ['rami levy', 'רמי לוי'] },
  { name: 'ויקטורי', aliases: ['victory', 'ויקטורי'] },
  { name: 'יוחננוף', aliases: ['yochananof', 'יוחננוף'] },
  { name: 'אושר עד', aliases: ['osher ad', 'אושר עד'] },
  { name: 'סופר-פארם', aliases: ['super-pharm', 'superpharm', 'super pharm', 'סופר-פארם', 'סופר פארם'] },
  { name: 'ניו פארם', aliases: ['new pharm', 'ניו פארם'] },
  { name: 'פוקס', aliases: ['fox', 'פוקס'] },
  { name: 'גולף', aliases: ['golf', 'גולף'] },
  { name: 'רנואר', aliases: ['renuar', 'רנואר'] },
  { name: 'המשביר', aliases: ['hamashbir', 'המשביר'] },
  { name: 'Zara', aliases: ['zara', 'זארה'] },
  { name: 'H&M', aliases: ['h&m', 'h & m'] },
  { name: 'Terminal X', aliases: ['terminal x', 'terminalx', 'טרמינל איקס'] },
  { name: 'American Eagle', aliases: ['american eagle', 'אמריקן איגל'] },
  { name: 'Adidas', aliases: ['adidas', 'אדידס'] },
  { name: 'Nike', aliases: ['nike', 'נייקי'] },
  { name: 'ללין', aliases: ['lalin', 'ללין'] },
  { name: 'סבון של פעם', aliases: ['sabon', 'סבון של פעם'] },
  { name: 'איקאה', aliases: ['ikea', 'איקאה'] },
  { name: 'הום סנטר', aliases: ['home center', 'הום סנטר'] },
  { name: 'ACE', aliases: ['ace hardware', 'ace', 'אייס'] },
  { name: 'אופיס דיפו', aliases: ['office depot', 'אופיס דיפו'] },
  { name: 'KSP', aliases: ['ksp'] },
  { name: 'איבורי', aliases: ['ivory', 'איבורי'] },
  { name: 'סטימצקי', aliases: ['steimatzky', 'סטימצקי'] },
  { name: 'צומת ספרים', aliases: ['tzomet sfarim', 'צומת ספרים'] },
  { name: 'BUYME', aliases: ['buyme', 'buy me', 'ביימי'] },
  { name: 'תו הזהב', aliases: ['tav hazahav', 'תו הזהב'] },
  { name: 'נופשונית', aliases: ['nofshonit', 'נופשונית'] },
  { name: 'דרים קארד', aliases: ['dream card', 'dreamcard', 'דרים קארד'] },
  { name: 'סיבוס', aliases: ['cibus', 'pluxee', 'סיבוס', 'פלוקסי'] },
  { name: 'תן ביס', aliases: ['10bis', 'תן ביס'] },
  { name: 'ארומה', aliases: ['aroma', 'ארומה'] },
  { name: 'קפה קפה', aliases: ['cafe cafe', 'קפה קפה'] },
  { name: 'לנדוור', aliases: ['landwer', 'לנדוור'] },
  { name: "מקדונלד'ס", aliases: ["mcdonald's", 'mcdonalds', 'מקדונלדס', "מקדונלד'ס"] },
  { name: 'סינמה סיטי', aliases: ['cinema city', 'סינמה סיטי'] },
  { name: 'יס פלאנט', aliases: ['yes planet', 'יס פלאנט'] },
]

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const isHebrew = (s) => /[֐-׿]/.test(s)

// One regex per alias. Word boundaries are done by hand because \b doesn't work for Hebrew.
// Hebrew aliases may carry a one-letter prefix (ב/ל/ו/ה/מ/ש/כ), e.g. "בקרפור".
const MATCHERS = BRANDS.flatMap(({ name, aliases }) =>
  aliases.map((alias) => {
    const body = escape(alias.toLowerCase()).replace(/\\?[\s-]+/g, '[\\s\\-]*')
    const prefix = isHebrew(alias) ? '[בלוהמשכ]?' : ''
    return { name, length: alias.length, re: new RegExp(`(?:^|[^\\p{L}\\p{N}])${prefix}(${body})(?=$|[^\\p{L}\\p{N}])`, 'u') }
  }),
)

// Returns the brand that appears earliest in the text (logos/titles are usually at the top).
export function detectBrand(text) {
  const t = text.toLowerCase().replace(/[״”“]/g, '"').replace(/[׳’‘`]/g, "'")
  let best = null
  for (const m of MATCHERS) {
    const hit = m.re.exec(t)
    if (!hit) continue
    const index = hit.index + hit[0].indexOf(hit[1])
    if (!best || index < best.index || (index === best.index && m.length > best.length)) best = { name: m.name, index, length: m.length }
  }
  return best?.name ?? ''
}
