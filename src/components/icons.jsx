const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const I = (paths) => (props) => <svg {...base} {...props}>{paths}</svg>

export const PlusIcon = I(<path d="M12 5v14M5 12h14" />)
export const XIcon = I(<path d="M18 6 6 18M6 6l12 12" />)
export const CameraIcon = I(<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>)
export const PencilIcon = I(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>)
export const CopyIcon = I(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>)
export const CheckIcon = I(<path d="M20 6 9 17l-5-5" />)
export const WalletIcon = I(<><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></>)
export const TrashIcon = I(<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>)
export const UndoIcon = I(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>)
export const MenuIcon = I(<><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>)
export const SearchIcon = I(<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>)
export const ImageIcon = I(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></>)
export const ClockIcon = I(<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>)
export const TicketIcon = I(<><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 17v2M13 11v2" /></>)
export const SparkIcon = I(<path d="M12 3l1.9 5.8L20 10.7l-5 3.6L16.8 21 12 17.3 7.2 21 9 14.3l-5-3.6 6.1-1.9z" />)
export const MailIcon = I(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>)
