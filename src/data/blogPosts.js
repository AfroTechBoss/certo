// ─── Certo Blog / Guide Posts ─────────────────────────────────────────────────
// Each post has: slug, title, excerpt, category, readTime, date, tags,
// relatedCategories (for product-page recommendations), featured, sections[]
// Sections are { heading?, body (string or string[]) }
// ─────────────────────────────────────────────────────────────────────────────

export const BLOG_CATEGORIES = ['Buying Guide', 'Repairs & Costs', 'Authenticity', 'How Certo Works', 'Tips & Tricks'];

export const BLOG_POSTS = [
  {
    slug: 'how-certo-orders-apple-from-us',
    title: 'How Certo Orders Apple Products Directly from the US',
    excerpt: 'Every device we sell starts as a real order placed on apple.com — no middlemen, no grey market. Here\'s exactly how it works.',
    category: 'How Certo Works',
    readTime: '5 min read',
    date: 'May 2025',
    featured: true,
    tags: ['Certo', 'Apple US', 'How It Works', 'Sourcing'],
    relatedCategories: ['iPhone', 'Mac', 'iPad', 'Apple Watch', 'AirPods'],
    emoji: '🛒',
    sections: [
      {
        heading: 'It Starts on Apple.com',
        body: 'When you place an order with Certo, we go directly to apple.com — the same website any customer in the United States would use to buy their device. We place the order under a verified US address, pay with a US-registered payment method, and the device ships from Apple\'s own warehouse in the US. This is not a grey market operation. There is no third-party supplier. The device goes from Apple\'s shelf to our shipping handler — no detours.',
      },
      {
        heading: 'Air Freight to Lagos',
        body: [
          'Once the device arrives at our US logistics partner, we consolidate shipments and send them via air freight directly to Murtala Muhammed Airport in Lagos. Every shipment is declared accurately at customs — duties are paid in full. We don\'t smuggle, we don\'t under-declare.',
          'The entire journey from Apple US to your door in Lagos typically takes 10–18 business days, depending on customs clearance speed.',
        ],
      },
      {
        heading: 'Serial Verification Before Delivery',
        body: 'Before any device leaves our hands, we verify the serial number directly on Apple\'s coverage checker at checkcoverage.apple.com. We confirm it is a genuine Apple device, the warranty start date matches the purchase date, it has never been previously activated under another Apple ID, and the model is the exact one ordered. Only after passing all four checks do we hand the device to the customer.',
      },
      {
        heading: 'The Certo Certificate',
        body: 'Every order comes with a Certo Certificate of Purchase — a publicly verifiable record on our website showing the serial number, chain of custody, and the exact route the device took from Apple to you. This is not a piece of paper you frame and forget. It is a living record you can share with anyone who doubts the authenticity of your device.',
      },
      {
        heading: 'Why This Matters',
        body: 'Many Apple resellers in Nigeria claim to source from the US but actually buy from grey market distributors in Dubai, Hong Kong, or China. These devices may be genuine Apple hardware, but they are region-locked, carry no Apple International warranty, and sometimes come pre-activated with unknown Apple IDs. With Certo, the sourcing chain is documented end-to-end. You can verify it yourself.',
      },
    ],
  },

  {
    slug: 'why-apple-from-us-beats-local-vendors',
    title: 'Why Buying Apple from the US (Through Certo) Beats Local Nigerian Vendors',
    excerpt: 'The iPhone at the computer village might look identical to one from Apple US — but the differences are real, and they matter.',
    category: 'Buying Guide',
    readTime: '6 min read',
    date: 'May 2025',
    featured: true,
    tags: ['Apple US', 'Local Vendors', 'Authenticity', 'Value'],
    relatedCategories: ['iPhone', 'Mac', 'iPad'],
    emoji: '🇺🇸',
    sections: [
      {
        heading: 'The Warranty Question',
        body: 'Apple devices sold in the United States come with a one-year limited warranty valid worldwide — but only if the device was purchased from an Authorised Apple Reseller or directly from Apple. Devices sold in Nigerian computer villages are often sourced from grey markets where the original purchase was made with stolen or fraudulently obtained payment methods. These devices may be deregistered from Apple\'s warranty system entirely. You cannot claim any service at an Apple Store with them.',
      },
      {
        heading: 'Model Variants Matter',
        body: [
          'Apple sells different variants of the same iPhone in different regions. The US model (model number A####) supports more cellular bands than the UAE or Chinese model. In Nigeria, most networks run on bands that the US model supports fully. The China model sometimes lacks certain LTE bands that affect data speeds on MTN, Airtel, and Glo.',
          'When you buy from Certo, you get the US model. When you buy from a vendor who sources from China or the Middle East, you may get a region-specific variant that technically works but does not perform as well.',
        ],
      },
      {
        heading: 'Price Transparency',
        body: 'Local vendors frequently change their prices based on who is asking. There is no published price list, no receipt that matches what you actually paid, and no recourse if the price changes between the time you agree and the time you pay. Certo publishes prices publicly on the website, in Nigerian Naira, at a locked exchange rate. The price you see when you add to cart is the price you pay at checkout.',
      },
      {
        heading: 'Pre-Activation and iCloud Lock',
        body: 'Some vendors — especially at computer village — sell iPhones that were previously activated with an Apple ID and never properly reset. When you try to set up the phone, you encounter the Activation Lock screen asking for the previous owner\'s Apple ID and password. The vendor\'s solution is always to "take it back so they fix it." That fix is usually unofficial and the iCloud lock can return. Every Certo device is verified clear of any previous Apple ID before delivery.',
      },
      {
        heading: 'The Bottom Line',
        body: 'The computer village iPhone might cost ₦50,000 less today. But when the warranty is voided, the iCloud lock reappears, or the device stops receiving iOS updates because of a region restriction — the "savings" disappear. You are not comparing apples to apples. Pun intended.',
      },
    ],
  },

  {
    slug: 'best-macbook-for-you-nigeria-2025',
    title: 'Which MacBook Should You Buy in Nigeria in 2025?',
    excerpt: 'MacBook Air M2 vs M3, MacBook Pro 14 vs 16 — a practical breakdown for Nigerian buyers at every budget and use case.',
    category: 'Buying Guide',
    readTime: '8 min read',
    date: 'June 2025',
    featured: true,
    tags: ['MacBook', 'Buying Guide', 'Mac', 'M2', 'M3'],
    relatedCategories: ['Mac'],
    emoji: '💻',
    sections: [
      {
        heading: 'Start with the Use Case, Not the Price',
        body: 'The biggest mistake Nigerian buyers make when choosing a MacBook is starting with a budget and working backwards. The right approach is to start with what you will actually do with it — then find the MacBook that handles that workload efficiently. A content creator who exports 4K video every day has completely different needs from a student who uses it for Google Docs and Zoom.',
      },
      {
        heading: 'For Most People: MacBook Air M2 or M3',
        body: [
          'The MacBook Air M2 is the best laptop most people in Nigeria will ever need. It handles video calls, document editing, web browsing, graphic design in Canva or Adobe Express, light photo editing, and even some video editing without breaking a sweat. The battery lasts 15–18 hours in real use.',
          'The MacBook Air M3 is a meaningful upgrade if you do anything involving machine learning, use external displays frequently, or want the latest architecture. For pure productivity work, the M2 and M3 Air perform identically in daily use.',
          'Neither the M2 nor M3 Air has a fan. They are completely silent. If sustained heavy workloads are part of your plan, read on.',
        ],
      },
      {
        heading: 'For Creators and Developers: MacBook Pro 14-inch',
        body: 'The MacBook Pro 14 starts with the M3 Pro chip, has active cooling (a fan), and can sustain heavy workloads indefinitely without throttling. This is the machine for software developers who run Docker and virtual machines, video editors who export hour-long timelines, 3D designers, and architects using heavy software like Revit or AutoCAD under Rosetta. It is substantially more expensive, but you will not outgrow it in 5 years.',
      },
      {
        heading: 'For Video Professionals: MacBook Pro 16-inch',
        body: 'The 16-inch is for one type of person: the professional who earns money directly from video production or post-production. If you are grading cinema-quality footage, editing multi-camera shoots, or doing audio mixing for broadcast, the 16-inch M3 Pro or Max gives you the screen real estate and thermal headroom to work for hours without compromise. For everyone else, this is overkill.',
      },
      {
        heading: 'What About RAM and Storage?',
        body: [
          'Unlike Windows laptops, MacBook RAM and storage cannot be upgraded after purchase. Get this right at the point of buying.',
          'RAM: 8GB is enough for light work. 16GB is the sweet spot for most people. 24GB or 36GB is for professional creative workloads. Get 16GB as a minimum if you plan to use the machine for more than 3 years.',
          'Storage: 256GB fills up quickly in Nigeria where you may not have reliable internet to stream everything. 512GB is the practical minimum. 1TB is ideal.',
        ],
      },
      {
        heading: 'Refurbished MacBooks from Certo',
        body: 'Certo sells certified refurbished MacBooks sourced directly from Apple\'s official refurbished store. These are not used laptops from individuals — they are Apple-certified devices that have passed Apple\'s full quality inspection and come with a one-year Apple warranty. They are an excellent way to get a MacBook Pro at MacBook Air pricing.',
      },
    ],
  },

  {
    slug: 'iphone-screen-replacement-prices-nigeria-2025',
    title: 'iPhone Screen Replacement Prices in Nigeria (2025)',
    excerpt: 'From iPhone 12 to iPhone 16 Pro Max — a realistic breakdown of what screen repairs actually cost across Lagos, Abuja, and online.',
    category: 'Repairs & Costs',
    readTime: '5 min read',
    date: 'June 2025',
    featured: false,
    tags: ['iPhone', 'Screen Repair', 'Prices', 'Nigeria', 'Repairs'],
    relatedCategories: ['iPhone'],
    emoji: '📱',
    sections: [
      {
        heading: 'Why iPhone Screen Repairs Are Expensive',
        body: 'Apple uses proprietary OLED and Super Retina XDR displays that cannot be bought from generic display suppliers without quality loss. A "cheap" iPhone screen replacement almost always means a third-party LCD panel — the colours look washed out, the touch sensitivity is reduced, and Face ID may stop working entirely depending on the model. Genuine Apple screens are only available through Apple Authorised Service Providers or through Apple\'s own self-repair program.',
      },
      {
        heading: 'Approximate Screen Repair Costs (2025)',
        body: [
          'These are estimates based on market surveys across major repair shops in Lagos and Abuja. Prices vary significantly.',
          'iPhone 12 / 12 Mini: ₦60,000 – ₦90,000',
          'iPhone 12 Pro / 12 Pro Max: ₦85,000 – ₦140,000',
          'iPhone 13 / 13 Mini: ₦80,000 – ₦110,000',
          'iPhone 13 Pro / 13 Pro Max: ₦100,000 – ₦160,000',
          'iPhone 14 / 14 Plus: ₦90,000 – ₦130,000',
          'iPhone 14 Pro / 14 Pro Max: ₦120,000 – ₦190,000',
          'iPhone 15 / 15 Plus: ₦100,000 – ₦145,000',
          'iPhone 15 Pro / 15 Pro Max: ₦150,000 – ₦220,000',
          'iPhone 16 / 16 Plus: ₦120,000 – ₦160,000',
          'iPhone 16 Pro / 16 Pro Max: ₦180,000 – ₦260,000',
        ],
      },
      {
        heading: 'Genuine vs Third-Party Screen: The Real Trade-off',
        body: 'A third-party screen costs 30–50% less but comes at a cost: True Tone is disabled, ProMotion (120Hz) may stop working, Face ID calibration can be affected, and the colour profile will look different. For the iPhone 14 and newer models, Apple introduced a parts pairing system that notifies you in Settings if a non-genuine part has been installed.',
      },
      {
        heading: 'Where to Get Your iPhone Screen Repaired in Nigeria',
        body: [
          'Apple does not have an official Authorised Service Provider in Nigeria as of 2025. Your options are:',
          'Tier 1 independent shops in Ikeja, Victoria Island, and Abuja who source genuine Apple displays from authorised channels. Expect to pay top-of-range prices but get genuine parts.',
          'Mid-range shops who use good-quality aftermarket OEM screens. These are close to genuine quality but will trigger the "non-genuine part" notification on newer iPhones.',
          'Low-end shops using cheap LCD panels. Avoid these for any iPhone 12 or newer.',
        ],
      },
      {
        heading: 'The Certo Perspective',
        body: 'This is exactly why we include AppleCare+ as an option at checkout. With AppleCare+, screen damage is covered for a fixed fee of approximately $29 USD through Apple\'s international coverage. If you are buying an iPhone through Certo, seriously consider adding AppleCare+. Given Nigerian screen repair prices, it pays for itself after a single incident.',
      },
    ],
  },

  {
    slug: 'iphone-battery-replacement-prices-nigeria-2025',
    title: 'iPhone Battery Replacement Prices in Nigeria (2025)',
    excerpt: 'When your iPhone battery drops below 80% health, Apple recommends replacing it. Here\'s what that actually costs in Nigeria.',
    category: 'Repairs & Costs',
    readTime: '4 min read',
    date: 'June 2025',
    featured: false,
    tags: ['iPhone', 'Battery', 'Repairs', 'Nigeria', 'Prices'],
    relatedCategories: ['iPhone'],
    emoji: '🔋',
    sections: [
      {
        heading: 'When Should You Replace Your iPhone Battery?',
        body: 'Apple considers a battery\'s useful life to be the period during which it retains at least 80% of its original capacity. You can check your battery health in Settings → Battery → Battery Health & Charging. If your Maximum Capacity is below 80%, performance throttling may be active, and Apple recommends replacement. Common signs include: the phone dying suddenly at 20–30%, the phone shutting down in hot weather, or noticeably slower performance on demanding apps.',
      },
      {
        heading: 'Battery Replacement Price Estimates (2025)',
        body: [
          'These prices reflect the Lagos and Abuja repair market. Genuine Apple batteries cost more; third-party (high-capacity) batteries are cheaper.',
          'iPhone 12 series: ₦18,000 – ₦30,000',
          'iPhone 13 series: ₦20,000 – ₦35,000',
          'iPhone 14 series: ₦22,000 – ₦38,000',
          'iPhone 15 series: ₦25,000 – ₦42,000',
          'iPhone 16 series: ₦28,000 – ₦50,000',
          'Note: Pro Max models typically cost ₦3,000 – ₦5,000 more than standard models due to harder disassembly.',
        ],
      },
      {
        heading: 'Genuine vs Third-Party Batteries',
        body: 'Third-party batteries marked "high capacity 4000mAh" for an iPhone 15 (which originally has 3274mAh) are almost always falsely labelled. The actual capacity is usually lower than genuine. More importantly, non-genuine batteries disable Optimised Battery Charging, Battery Health tracking, and trigger the "Unable to verify this iPhone has a genuine Apple battery" notification in Settings.',
      },
      {
        heading: 'AppleCare+ and Battery Coverage',
        body: 'With AppleCare+, Apple replaces your battery free of charge if it drops below 80% capacity. This is a significant benefit. If you purchased your iPhone through Certo with AppleCare+ included, you can claim this internationally at any Apple Store or Authorised Service Provider worldwide — including when travelling to the UK, US, or UAE.',
      },
      {
        heading: 'DIY Battery Replacement',
        body: 'Apple\'s Self Repair Program does not currently cover Nigeria. Attempting a battery replacement without professional tools risks damaging the display, the face ID components, and the waterproofing seal. Unless you are an experienced technician, we do not recommend self-repair for iPhones beyond replacing the display glass on older models.',
      },
    ],
  },

  {
    slug: 'how-to-spot-fake-tampered-iphone-nigeria',
    title: 'How to Know if an iPhone is Fake, Refurbished, or Tampered With',
    excerpt: 'Computer village is full of iPhones. Not all of them are what they claim to be. Here\'s a complete checklist to verify any iPhone before you buy.',
    category: 'Authenticity',
    readTime: '7 min read',
    date: 'May 2025',
    featured: true,
    tags: ['iPhone', 'Fake', 'Authenticity', 'Buying Guide', 'Nigeria'],
    relatedCategories: ['iPhone'],
    emoji: '🔍',
    sections: [
      {
        heading: 'Step 1: Check the Serial Number on Apple\'s Website',
        body: [
          'Go to checkcoverage.apple.com and enter the serial number. You can find the serial number in Settings → General → About → Serial Number.',
          'A genuine, unmodified iPhone will show: the correct model name (e.g., "iPhone 15 Pro"), an active or recently expired warranty, and a purchase date that makes sense.',
          'Red flags: "Unable to check coverage" (may indicate a cloned or blacklisted device), a purchase date that does not match what the seller claims, or a model that does not match the device in your hand.',
        ],
      },
      {
        heading: 'Step 2: Check the IMEI',
        body: 'Dial *#06# to get the IMEI number. Then verify it at imei.info. This will tell you if the device has been reported stolen, if it is blacklisted on any network, and the original specs of the device. A phone with a clean IMEI check is not necessarily genuine — but a phone with a failed IMEI check is almost certainly stolen or cloned.',
      },
      {
        heading: 'Step 3: Inspect the Physical Device',
        body: [
          'Look at the screws at the bottom of the iPhone (the two screws flanking the Lightning or USB-C port). Genuine iPhones use proprietary Pentalobe screws. If the screws look stripped, damaged, or replaced with Phillips screws, the phone has been opened — almost certainly for a battery or screen replacement. This is not automatically a problem, but it should be disclosed.',
          'Check for gaps between the screen and the chassis. A genuine iPhone has a seamless fit. An aftermarket screen often shows a slight gap or uneven depth.',
          'Check Face ID: It should work immediately and consistently. A phone with a replaced or third-party screen often has impaired Face ID.',
        ],
      },
      {
        heading: 'Step 4: Look for the "Non-Genuine Part" Notification',
        body: 'On iPhone 14 and newer models, go to Settings → General → About. If any genuine part has been replaced with a non-Apple part, a notification will appear here. This is Apple\'s parts pairing system. A phone showing "Unknown Part" for the battery, camera, or display has had official components replaced with aftermarket parts. The phone may still work — but you should know, and the price should reflect it.',
      },
      {
        heading: 'Step 5: Check Activation Lock Status',
        body: 'Before buying any second-hand iPhone, ask the seller to turn off the phone and power it back on in front of you. If the phone boots to a screen asking for an Apple ID and password that the seller cannot provide, it is iCloud locked. Do not buy it. There is no legitimate way to remove iCloud lock without the original Apple ID credentials. Any shop that claims they can "unlock" iCloud within minutes is either lying or using a device that has been illegally hacked — which can result in the lock returning.',
      },
      {
        heading: 'Step 6: Chinese vs Nigerian-Market Clones',
        body: 'Fully fake iPhones — running Android underneath with an iPhone-like interface — do exist and are still sold at computer village. They are typically priced at ₦50,000–₦120,000 for what appears to be an "iPhone 15 Pro." The giveaways: the home button on a Pro model, significantly more weight than a real iPhone, lag on basic swipe gestures, and a camera app that has no visible depth effect or ProRAW option. Always verify with the apple.com serial check before handing over any money.',
      },
    ],
  },

  {
    slug: 'what-is-applecare-plus-nigeria',
    title: 'AppleCare+ Explained: Is It Worth It When Buying in Nigeria?',
    excerpt: 'AppleCare+ adds accident coverage, battery protection, and Apple support to your device. Here\'s exactly what you get and whether it makes sense for a Nigerian buyer.',
    category: 'Buying Guide',
    readTime: '5 min read',
    date: 'June 2025',
    featured: false,
    tags: ['AppleCare+', 'Warranty', 'Nigeria', 'Buying Guide'],
    relatedCategories: ['iPhone', 'Mac', 'iPad', 'Apple Watch', 'AirPods'],
    emoji: '🛡️',
    sections: [
      {
        heading: 'What AppleCare+ Actually Covers',
        body: [
          'AppleCare+ extends your Apple warranty from 1 year to 2 years and adds two key protections:',
          'Accidental Damage Coverage: Up to 2 incidents per year. Screen damage is covered for a fixed ₦15,000–₦30,000 equivalent service fee (Apple charges $29 USD). Other accidental damage (e.g., dropped iPhone) is covered for approximately $99 USD.',
          'Battery Coverage: If your battery health drops below 80%, Apple replaces it free of charge.',
          'Express Replacement Service: Apple ships you a replacement device before you return your damaged one — so you are never without a phone.',
        ],
      },
      {
        heading: 'Does It Work in Nigeria?',
        body: 'Yes — with a caveat. AppleCare+ coverage is international. You can claim it at any Apple Store or Authorised Service Provider worldwide. Nigeria does not have an official Apple Store, but if you travel to the UK, US, UAE, or South Africa, you can walk into an Apple Store and claim your coverage. For Nigerian residents who do not travel frequently, the battery replacement benefit is the most practical local value.',
      },
      {
        heading: 'The Numbers in 2025',
        body: [
          'AppleCare+ for iPhone 15 Pro costs approximately $199 USD = ~₦310,000 at current rates.',
          'One iPhone 15 Pro screen repair in Lagos costs ₦150,000 – ₦220,000.',
          'One battery replacement costs ₦25,000 – ₦42,000.',
          'If you crack your screen once in two years AND need a battery replacement, AppleCare+ has more than paid for itself.',
        ],
      },
      {
        heading: 'Who Should Get AppleCare+?',
        body: [
          'Get it if: You are buying a Pro model (higher repair costs), you have a history of cracking screens, you travel internationally at least once a year, or you are buying for a student or teenager.',
          'Skip it if: You have a protective case and tempered glass, you have never cracked a phone, or you are buying a lower-cost model where repair costs are more reasonable.',
        ],
      },
    ],
  },

  {
    slug: 'iphone-vs-android-nigeria-2025',
    title: 'iPhone vs Android in Nigeria: An Honest Comparison for 2025',
    excerpt: 'The iPhone vs Android debate never gets old. But in the Nigerian context — with our data costs, power situation, and repair ecosystem — the calculus is different.',
    category: 'Buying Guide',
    readTime: '6 min read',
    date: 'June 2025',
    featured: false,
    tags: ['iPhone', 'Android', 'Nigeria', 'Comparison'],
    relatedCategories: ['iPhone'],
    emoji: '⚖️',
    sections: [
      {
        heading: 'iOS Updates: iPhones Last Longer',
        body: 'Apple supports iPhones with software updates for 5–7 years after release. The iPhone 12 (released 2020) still runs iOS 18 in 2025. Most Android flagships receive 3–4 years of updates. In Nigeria where buying a new phone every 2 years is not practical for most people, the longevity of iOS support is a real financial advantage.',
      },
      {
        heading: 'Battery Life in Nigerian Conditions',
        body: 'Nigerian iPhones face unique stress: frequent charging due to power cuts, using a power bank multiple times per day, and operating in high ambient temperatures that accelerate battery degradation. The iPhone 15 Pro Max and iPhone 16 series have made significant battery life improvements. For Android at a comparable price point, Samsung\'s S series and the Google Pixel 9 also deliver strong battery life.',
      },
      {
        heading: 'Repair Ecosystem',
        body: 'This is Android\'s biggest advantage in Nigeria. Samsung, Tecno, and Infinix parts are widely available and cheap. iPhone parts are harder to source, require specialist tools, and are significantly more expensive. If you cannot afford AppleCare+ and have a history of breaking phones, an Android flagship may be more practical.',
      },
      {
        heading: 'Resale Value',
        body: 'iPhones hold their resale value far better than Android phones in Nigeria. An iPhone 13 bought in 2021 for ₦600,000 resells for ₦350,000–₦400,000 in 2025. A Samsung Galaxy S22 bought for the same price in 2021 resells for ₦150,000–₦200,000. If you plan to trade up every few years, iPhones preserve your capital better.',
      },
      {
        heading: 'The Ecosystem Lock-In',
        body: 'If you use a Mac, iPad, or AirPods, the iPhone\'s ecosystem integration is unmatched — Universal Clipboard, Handoff, AirDrop, and iMessage over cellular work seamlessly across all Apple devices. If you are deep in the Google ecosystem with a Chromebook or Android tablet, an Android phone fits more naturally.',
      },
    ],
  },
];

// Get posts by category
export const getPostsByCategory = (category) =>
  BLOG_POSTS.filter(p => p.category === category);

// Get related posts for a product category
export const getRelatedPosts = (productCategory, count = 3) => {
  const matching = BLOG_POSTS.filter(p =>
    p.relatedCategories.includes(productCategory)
  );
  // Shuffle and take `count`
  const shuffled = [...matching].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).length ? shuffled.slice(0, count)
    : BLOG_POSTS.filter(p => p.featured).slice(0, count);
};

// Get featured / homepage posts
export const getFeaturedPosts = (count = 3) => {
  const featured = BLOG_POSTS.filter(p => p.featured);
  const rest = BLOG_POSTS.filter(p => !p.featured);
  return [...featured, ...rest].slice(0, count);
};
