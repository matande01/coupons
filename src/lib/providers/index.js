// Voucher Catcher provider registry.
//
// To support a new brand: copy one of the files in this folder (e.g. carrefour.js),
// change `brand`, `detect` and the field regexes, then add it to PROVIDERS below.
// Fields a provider doesn't define (or doesn't find) fall back to the generic parser.
import carrefour from './carrefour'
import terminalx from './terminalx'
import dreamcard from './dreamcard'
import tavplus from './tavplus'
import katsefet from './katsefet'

export const PROVIDERS = [carrefour, terminalx, dreamcard, tavplus, katsefet]
