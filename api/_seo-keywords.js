/**
 * _seo-keywords.js
 *
 * Smart Sub-Category & Real-Life Search Keyword Engine for Perkfinity SEO/GEO.
 * Analyzes a merchant's business_name, promo_description, welcome_offer_text, and business_category
 * to automatically generate real-world consumer search terms (e.g. "auto repair deals in Mission Viejo",
 * "nail salon coupons", "med spa specials") and specific Schema.org @type classifications.
 */

const NICHE_RULES = [
  {
    id: 'auto_repair',
    test: /\b(auto|automotive|mechanic|smog|collision|brake|tire|tires|car repair|body shop|oil change|transmission|motor)\b/i,
    primaryNiche: 'Auto Repair & Car Service',
    categoryHeading: 'Auto Repair, Mechanic & Car Service Deals',
    schemaType: 'AutoRepair',
    keywords: [
      'auto repair deals',
      'mechanic coupons',
      'car repair discounts',
      'oil change specials',
      'brake service deals',
      'auto body & collision repair',
      'smog check & car maintenance',
      'automotive service offers'
    ]
  },
  {
    id: 'nail_salon',
    test: /\b(nail|nails|manicure|pedicure|mani-pedi|gel nails|acrylic nails|nail spa|nail bar|nail salon|nail saloon)\b/i,
    primaryNiche: 'Nail Salon, Manicure & Pedicure',
    categoryHeading: 'Nail Salon, Manicure & Pedicure Deals',
    schemaType: 'NailSalon',
    keywords: [
      'nail salon deals',
      'manicure & pedicure coupons',
      'gel nails discount',
      'acrylic nails specials',
      'nail spa offers',
      'mani pedi deals'
    ]
  },
  {
    id: 'med_spa_wellness',
    test: /\b(med\s*spa|medspa|derm|botox|laser|facial|facials|skincare|skin care|aesthetics|esthetic|massage|day spa|spa|wellness|acupuncture|chiropractic|chiropractor|reiki|holistic)\b/i,
    primaryNiche: 'Spa, Skincare & Wellness',
    categoryHeading: 'Spa, Massage, Skincare & Wellness Deals',
    schemaType: 'DaySpa',
    keywords: [
      'spa deals',
      'med spa specials',
      'day spa coupons',
      'facial & skincare discounts',
      'massage therapy offers',
      'Botox & laser treatment deals',
      'wellness center discounts',
      'beauty & self-care perks'
    ]
  },
  {
    id: 'hair_barber',
    test: /\b(hair|haircut|haircuts|barber|barbershop|salon|blowout|balayage|stylist|bestcuts|cuts|colorist|shave)\b/i,
    primaryNiche: 'Hair Salon & Barbershop',
    categoryHeading: 'Hair Salon, Haircut & Barbershop Deals',
    schemaType: 'HairSalon',
    keywords: [
      'haircut deals',
      'hair salon coupons',
      'barbershop discounts',
      'mens & womens haircuts',
      'hair styling & color specials',
      'local salon offers'
    ]
  },
  {
    id: 'smoothie_juice_acai',
    test: /\b(juicy|juice|smoothie|smoothies|acai|açaí|bowl|bowls|boba|pressed juice)\b/i,
    primaryNiche: 'Smoothies, Fresh Juice & Acai Bowls',
    categoryHeading: 'Smoothie, Juice Bar, Coffee & Cafe Deals',
    schemaType: 'CafeOrCoffeeShop',
    keywords: [
      'smoothie deals',
      'fresh juice bar coupons',
      'acai bowl discounts',
      'healthy drinks & cafe specials',
      'juice shop offers'
    ]
  },
  {
    id: 'coffee_tea_chai',
    test: /\b(coffee|espresso|roaster|roasters|chai|tea|matcha|latte|cafe|café)\b/i,
    primaryNiche: 'Coffee, Specialty Tea & Cafe',
    categoryHeading: 'Smoothie, Juice Bar, Coffee & Cafe Deals',
    schemaType: 'CafeOrCoffeeShop',
    keywords: [
      'coffee shop deals',
      'cafe coupons',
      'specialty tea & chai discounts',
      'latte & espresso specials',
      'local coffeehouse offers'
    ]
  },
  {
    id: 'bakery_sweets_dessert',
    test: /\b(sweets|bakery|bakeshop|pastry|pastries|cookie|cookies|cake|cakes|cupcake|dessert|desserts|ice cream|gelato|chocolate|confection|sourdough)\b/i,
    primaryNiche: 'Bakery, Desserts & Sweet Treats',
    categoryHeading: 'Bakery, Desserts & Sweet Treat Deals',
    schemaType: 'Bakery',
    keywords: [
      'bakery deals',
      'dessert coupons',
      'custom cakes & cookies discounts',
      'pastries & sweet treats specials',
      'local bakeshop offers'
    ]
  },
  {
    id: 'indian_restaurant',
    test: /\b(indian|curry|rasoi|sattva|chaska|tandoori|masala|biryani|tikka|naan|chaat)\b/i,
    primaryNiche: 'Indian Restaurant & Dining',
    categoryHeading: 'Restaurant, Dining & Takeout Deals',
    schemaType: 'Restaurant',
    keywords: [
      'Indian restaurant deals',
      'Indian food coupons',
      'curry & biryani specials',
      'lunch & dinner discounts',
      'restaurant takeout offers',
      'local dining deals'
    ]
  },
  {
    id: 'home_services_remodeling',
    test: /\b(kitchen and bath|kitchen & bath|baths|remodel|remodeling|renovation|water system|water systems|filtration|plumbing|plumber|hvac|air conditioning|roofing|solar|flooring|cabinets|contractor|home improvement|home revolution|handyman|carpet cleaning|landscaping)\b/i,
    primaryNiche: 'Home Improvement, Remodeling & Home Services',
    categoryHeading: 'Home Improvement, Remodeling & Home Service Deals',
    schemaType: 'HomeAndConstructionBusiness',
    keywords: [
      'home improvement deals',
      'kitchen & bath remodeling discounts',
      'home services coupons',
      'local contractor specials',
      'water filtration & home upgrade offers'
    ]
  },
  {
    id: 'restaurant_dining',
    test: /\b(restaurant|dining|grill|bistro|taco|tacos|mexican|pizza|pizzeria|italian|sushi|ramen|thai|mediterranean|burger|burgers|bbq|deli|eatery|food truck|catering)\b/i,
    primaryNiche: 'Restaurant & Local Dining',
    categoryHeading: 'Restaurant, Dining & Takeout Deals',
    schemaType: 'Restaurant',
    keywords: [
      'restaurant deals',
      'dining coupons',
      'lunch & dinner specials',
      'takeout & food discounts',
      'local restaurant offers'
    ]
  },
  {
    id: 'education_tutoring_stem',
    test: /\b(stem|stemtree|tutor|tutoring|education|learning|coding|robotics|math|science|academy|school|classes|kids|enrichment|music lessons)\b/i,
    primaryNiche: 'STEM Classes, Tutoring & Kids Education',
    categoryHeading: 'Tutoring, STEM Classes & Education Deals',
    schemaType: 'EducationalOrganization',
    keywords: [
      'tutoring deals',
      'STEM classes for kids',
      'coding & robotics camp discounts',
      'after-school program coupons',
      'math & science tutoring specials',
      'kids learning center offers'
    ]
  },
  {
    id: 'fitness_gym_yoga',
    test: /\b(gym|fitness|yoga|pilates|crossfit|workout|personal training|martial arts|karate|jiu jitsu|kickboxing|Barre)\b/i,
    primaryNiche: 'Fitness, Gym & Studio Classes',
    categoryHeading: 'Fitness, Gym, Yoga & Pilates Deals',
    schemaType: 'ExerciseGym',
    keywords: [
      'gym deals',
      'fitness studio coupons',
      'yoga & pilates class discounts',
      'personal training specials',
      'workout membership offers'
    ]
  },
  {
    id: 'dental_medical_optometry',
    test: /\b(dental|dentist|orthodontist|teeth whitening|optometry|optometrist|eye exam|glasses|medical|clinic|urgent care|veterinary|vet)\b/i,
    primaryNiche: 'Dental, Vision & Healthcare',
    categoryHeading: 'Dental, Vision & Healthcare Deals',
    schemaType: 'MedicalBusiness',
    keywords: [
      'dentist deals',
      'dental cleaning & whitening coupons',
      'eye exam & glasses discounts',
      'healthcare & clinic specials'
    ]
  },
  {
    id: 'pet_services',
    test: /\b(pet|dog|cat|grooming|groomer|boarding|doggy daycare|pet supply|veterinarian)\b/i,
    primaryNiche: 'Pet Grooming & Pet Care',
    categoryHeading: 'Pet Grooming, Boarding & Pet Store Deals',
    schemaType: 'LocalBusiness',
    keywords: [
      'pet grooming deals',
      'dog grooming coupons',
      'pet store discounts',
      'doggy daycare & boarding specials'
    ]
  },
  {
    id: 'apparel_fashion_retail',
    test: /\b(apparel|clothing|shirt|shirts|hawaiian|fashion|boutique|jewelry|shoes|footwear|trading co|retail|gift shop|florist|flowers)\b/i,
    primaryNiche: 'Boutique, Apparel & Specialty Retail',
    categoryHeading: 'Apparel, Boutique & Retail Shopping Deals',
    schemaType: 'ClothingStore',
    keywords: [
      'clothing store deals',
      'boutique coupons',
      'apparel & fashion discounts',
      'local retail shopping offers',
      'promo codes & store specials'
    ]
  }
];

function extractShortOfferHook(offerText) {
  if (!offerText) return 'Exclusive Deal';
  const str = String(offerText).trim();
  const dollarMatch = str.match(/\$\d+(?:\.\d{1,2})?\s*off/i);
  if (dollarMatch) return dollarMatch[0].replace(/\s+/g, ' ').replace(/off/i, 'Off');
  const pctMatch = str.match(/\d+%\s*off/i);
  if (pctMatch) return pctMatch[0].replace(/\s+/g, ' ').replace(/off/i, 'Off');
  if (/\bbogo\b|buy one get one/i.test(str)) return 'BOGO Deal';
  if (/\bfree\b/i.test(str)) return 'Free Bonus Perk';
  return 'Verified Deal';
}

function classifyMerchantSEO(m) {
  const bName = m.business_name || m.merchant_name || 'Local Business';
  const city = m.city || 'Orange County';
  const state = m.state || 'CA';
  const zip = m.postal_code || '';
  const offer = m.welcome_offer_text || 'Exclusive Member Perk';
  const desc = m.promo_description || '';
  const rawCat = m.business_category || 'Local Dining & Retail';

  const combinedText = `${bName} ${desc} ${offer} ${rawCat}`;

  // 1. First priority: match on business_name + welcome_offer_text (most specific to core identity)
  const nameAndOffer = `${bName} ${offer}`;
  let matchedRule = NICHE_RULES.find(r => r.test.test(nameAndOffer));

  // 2. Second priority: match on business_name + promo_description + welcome_offer_text
  if (!matchedRule) {
    const nameAndDesc = `${bName} ${desc} ${offer}`;
    matchedRule = NICHE_RULES.find(r => r.test.test(nameAndDesc));
  }

  // 3. Third priority: match including raw category
  if (!matchedRule) {
    matchedRule = NICHE_RULES.find(r => r.test.test(combinedText));
  }

  // Fallback based on broad business_category if no specific regex matched
  if (!matchedRule) {
    if (/food|beverage|restaurant|dining|cafe/i.test(rawCat)) {
      matchedRule = NICHE_RULES.find(r => r.id === 'restaurant_dining');
    } else if (/health|beauty|wellness|salon|spa/i.test(rawCat)) {
      matchedRule = NICHE_RULES.find(r => r.id === 'med_spa_wellness');
    } else if (/home, auto|home & auto|trade/i.test(rawCat)) {
      matchedRule = NICHE_RULES.find(r => r.id === 'home_services_remodeling');
    } else if (/education|kids|tutor/i.test(rawCat)) {
      matchedRule = NICHE_RULES.find(r => r.id === 'education_tutoring_stem');
    } else {
      matchedRule = {
        id: 'local_business',
        primaryNiche: rawCat.replace(/^🏪\s*/, ''),
        categoryHeading: 'Local Shopping & Service Deals',
        schemaType: 'LocalBusiness',
        keywords: [
          'local business deals',
          'store coupons',
          'member discounts',
          'neighborhood specials'
        ]
      };
    }
  }

  const shortOffer = extractShortOfferHook(offer);
  const localizedKeywords = [];

  // Build localized real-life search phrases (e.g. "auto repair deals in Mission Viejo", "Mission Viejo auto repair coupons")
  matchedRule.keywords.forEach(kw => {
    localizedKeywords.push(`${kw} in ${city}`);
    localizedKeywords.push(`${city} ${kw}`);
  });

  // Add brand + commercial intent variants
  const allKeywords = [
    `${bName} deals`,
    `${bName} coupons`,
    `${bName} discounts`,
    `${bName} ${city}`,
    ...localizedKeywords.slice(0, 8),
    ...matchedRule.keywords,
    `${city} deals`,
    `${city} coupons`,
    zip ? `${zip} local deals` : null,
    'Perkfinity'
  ].filter(Boolean);

  // Deduplicate case-insensitively
  const seen = new Set();
  const dedupedKeywords = allKeywords.filter(k => {
    const low = k.toLowerCase();
    if (seen.has(low)) return false;
    seen.add(low);
    return true;
  });

  // Construct high-ranking Title, Meta Description, and Schema metadata
  const pageTitle = `${bName} — ${matchedRule.primaryNiche} Deals & Coupons in ${city}, ${state} (${shortOffer}) | Perkfinity`;
  const cleanDescSnippet = desc
    ? ' ' + desc.replace(/\s+/g, ' ').trim().slice(0, 110).replace(/[.,;:\s]+$/, '') + '.'
    : '';
  const metaDescription = `${offer} at ${bName} in ${city}, ${state}${zip ? ' ' + zip : ''}. Verified ${matchedRule.keywords.slice(0, 3).join(', ')} on Perkfinity.${cleanDescSnippet}`;

  return {
    nicheId: matchedRule.id,
    primaryNiche: matchedRule.primaryNiche,
    categoryHeading: matchedRule.categoryHeading,
    schemaType: matchedRule.schemaType,
    shortOffer,
    pageTitle,
    metaDescription: metaDescription.slice(0, 300),
    metaKeywords: dedupedKeywords.slice(0, 18).join(', '),
    serviceKeywords: matchedRule.keywords
  };
}

module.exports = {
  NICHE_RULES,
  classifyMerchantSEO,
  extractShortOfferHook
};
