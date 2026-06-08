// ─── Dashboard-wide constants ────────────────────────────────────────────────
// Single source of truth for status colours, lists, and category enums.

// Order status → pill colours (used by StatusPill and a few other components)
export const DASH_STATUS_COLORS = {
  'Payment Pending':          { bg: 'oklch(95% 0.07 70)',  fg: 'oklch(45% 0.16 55)',  dot: 'oklch(60% 0.18 55)'  },
  'Order Confirmed':          { bg: 'oklch(94% 0.05 250)', fg: 'oklch(42% 0.15 250)', dot: 'oklch(55% 0.16 250)' },
  'Purchased from Apple':     { bg: 'oklch(95% 0.04 30)',  fg: 'oklch(45% 0.13 30)',  dot: 'oklch(58% 0.15 30)'  },
  'In Transit to US Partner': { bg: 'oklch(94% 0.05 220)', fg: 'oklch(43% 0.13 220)', dot: 'oklch(56% 0.14 220)' },
  'Customs Clearance':        { bg: 'oklch(96% 0.06 80)',  fg: 'oklch(46% 0.14 65)',  dot: 'oklch(60% 0.16 65)'  },
  'Arrived in Nigeria':       { bg: 'oklch(94% 0.07 155)', fg: 'oklch(38% 0.15 155)', dot: 'oklch(52% 0.16 155)' },
  'Out for Delivery':         { bg: 'oklch(95% 0.07 60)',  fg: 'oklch(44% 0.16 55)',  dot: 'oklch(60% 0.17 55)'  },
  'Delivered':                { bg: 'oklch(93% 0.06 155)', fg: 'oklch(35% 0.15 155)', dot: 'oklch(50% 0.17 155)' },
  'Cancelled':                { bg: 'oklch(94% 0.02 0)',   fg: 'oklch(48% 0.04 0)',   dot: 'oklch(60% 0.04 0)'   },
};
export const dashStatus = (s) => DASH_STATUS_COLORS[s] || DASH_STATUS_COLORS['Order Confirmed'];

// Donut chart segment palette (legacy, used by DonutChart)
export const DONUT_COLORS = [
  'var(--accent)',
  'oklch(55% 0.16 250)',
  'oklch(55% 0.15 155)',
  'oklch(60% 0.16 60)',
  'oklch(52% 0.16 310)',
  'oklch(50% 0.08 220)',
];

// Nigerian states — used by Create Order modal + Refund editor
export const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT – Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

// Product categories — used by Product create modal
export const PROD_CATS = ['iPhone', 'Mac', 'iMac', 'iPad', 'AirPods', 'Watch', 'Apple TV', 'HomePod', 'Accessories'];

// Blog editor enums
export const BLOG_CATS = ['Buying Guide', 'Repairs & Costs', 'Authenticity', 'How Certo Works', 'Tips & Tricks'];
export const BLOG_REL  = ['iPhone', 'Mac', 'iPad', 'Apple Watch', 'AirPods'];

// Refund editor enums
export const REFUND_STATUSES = ['pending', 'processing', 'completed', 'rejected'];
export const REFUND_METHODS  = ['Bank Transfer', 'Cash', 'Paystack Reversal', 'Flutterwave Reversal', 'Other'];

// Each bank is { name, code }. The code is the official NIBSS bank code
// (used by Paystack / Flutterwave APIs when initiating transfers).
export const NG_BANKS = [
  { name: 'Access Bank',     code: '044'    },
  { name: 'ALAT by WEMA',    code: '035A'   },
  { name: 'Carbon',          code: '565'    },
  { name: 'Citibank',        code: '023'    },
  { name: 'Ecobank',         code: '050'    },
  { name: 'Fidelity Bank',   code: '070'    },
  { name: 'First Bank',      code: '011'    },
  { name: 'FCMB',            code: '214'    },
  { name: 'GTBank',          code: '058'    },
  { name: 'Keystone Bank',   code: '082'    },
  { name: 'Kuda Bank',       code: '50211'  },
  { name: 'Lotus Bank',      code: '303'    },
  { name: 'Moniepoint',      code: '50515'  },
  { name: 'OPay',            code: '999992' },
  { name: 'PalmPay',         code: '999991' },
  { name: 'Polaris Bank',    code: '076'    },
  { name: 'Providus Bank',   code: '101'    },
  { name: 'Stanbic IBTC',    code: '221'    },
  { name: 'Sterling Bank',   code: '232'    },
  { name: 'TAJ Bank',        code: '302'    },
  { name: 'Union Bank',      code: '032'    },
  { name: 'UBA',             code: '033'    },
  { name: 'Unity Bank',      code: '215'    },
  { name: 'Vale Finance',    code: '050020' },
  { name: 'VFD MFB',         code: '566'    },
  { name: 'Wema Bank',       code: '035'    },
  { name: 'Zenith Bank',     code: '057'    },
];

// Utility: slugify a blog post title.
export const slugify = (t) =>
  t.toLowerCase()
   .trim()
   .replace(/[^a-z0-9\s-]/g, '')
   .replace(/\s+/g, '-')
   .replace(/-+/g, '-');
