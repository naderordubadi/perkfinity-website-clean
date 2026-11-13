/**
 * _seo-keywords.js
 *
 * Smart Sub-Category & Real-Life Search Keyword Engine for Perkfinity SEO/GEO.
 * Analyzes a merchant's business_name, promo_description, welcome_offer_text, and business_category
 * to automatically generate real-world consumer search terms (e.g. "perio dental deals in Mission Viejo",
 * "auto repair deals in Mission Viejo", "art gallery & boutique specials") and specific Schema.org @type classifications.
 * Also provides shared nationwide region resolution via resolveRegionHub().
 */

const OC_CITIES = new Set([
  'aliso-viejo', 'anaheim', 'brea', 'buena-park', 'costa-mesa', 'cypress',
  'dana-point', 'fountain-valley', 'fullerton', 'garden-grove', 'huntington-beach',
  'irvine', 'la-habra', 'la-palma', 'ladera-ranch', 'laguna-beach', 'laguna-hills',
  'laguna-niguel', 'laguna-woods', 'lake-forest', 'los-alamitos', 'mission-viejo',
  'newport-beach', 'orange', 'orange-county', 'placentia', 'rancho-santa-margarita',
  'san-clemente', 'san-juan-capistrano', 'santa-ana', 'seal-beach', 'stanton',
  'trabuco-canyon', 'tustin', 'villa-park', 'westminster', 'yorba-linda'
]);

const LA_COUNTY_CITIES = new Set([
  'los-angeles', 'los-angeles-county', 'pasadena', 'long-beach', 'glendale',
  'santa-monica', 'burbank', 'beverly-hills', 'torrance', 'culver-city',
  'west-hollywood', 'pomona', 'el-monte', 'downey', 'inglewood', 'santa-clarita'
]);

const SD_COUNTY_CITIES = new Set([
  'san-diego', 'san-diego-county', 'carlsbad', 'encinitas', 'oceanside',
  'escondido', 'chula-vista', 'la-jolla', 'del-mar', 'san-marcos', 'vista',
  'el-cajon', 'coronado'
]);

function slugifyBasic(text) {
  if (!text) return '';
  return String(text).toLowerCase().trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveRegionHub(city, state) {
  const cSlug = slugifyBasic(city);
  const st = (state || '').trim().toUpperCase();
  const isCA = !st || st === 'CA' || st === 'CALIFORNIA';

  if (isCA && OC_CITIES.has(cSlug)) {
    return {
      slug: 'orange-county',
      name: 'Orange County',
      areaName: 'Orange County, CA',
      href: '/deals/orange-county',
      isCountyHub: true
    };
  }
  if (isCA && LA_COUNTY_CITIES.has(cSlug)) {
    return {
      slug: 'los-angeles-county',
      name: 'Los Angeles County',
      areaName: 'Los Angeles County, CA',
      href: '/deals/los-angeles-county',
      isCountyHub: true
    };
  }
  if (isCA && SD_COUNTY_CITIES.has(cSlug)) {
    return {
      slug: 'san-diego-county',
      name: 'San Diego County',
      areaName: 'San Diego County, CA',
      href: '/deals/san-diego-county',
      isCountyHub: true
    };
  }
  return {
    slug: null,
    name: 'Local Deals',
    areaName: city ? `${city}${st ? ', ' + st : ''}` : 'United States',
    href: '/localperks',
    isCountyHub: false
  };
}

const NICHE_RULES = [
  {
    id: 'veterinary_care',
    test: /\b(veterinar\w*|vet\s+clinic|animal\s+hospital|animal\s+clinic|pet\s+hospital|pet\s+dental)\b/i,
    primaryNiche: 'Veterinary Clinic & Animal Hospital',
    categoryHeading: 'Pet Care, Grooming & Veterinary Deals',
    schemaType: 'VeterinaryCare',
    keywords: [
      'veterinary clinic deals',
      'vet exam coupons',
      'animal hospital specials',
      'pet wellness & vaccine discounts',
      'local vet care offers'
    ]
  },
  {
    id: 'dental_periodontics_ortho',
    test: /\b(dental|dentist|dentistry|perio|periodont\w*|implant|implants|orthodont\w*|invisalign|braces|endodont\w*|root\s+canal|oral\s+surg\w*|prosthodont\w*|teeth\s+whitening|gum\s+care|gum\s+treatment|dds|dmd)\b/i,
    primaryNiche: 'Dentist & Family Dental Care',
    categoryHeading: 'Dentist, Periodontist & Dental Care Deals',
    schemaType: 'Dentist',
    keywords: [
      'dental deals',
      'dentist coupons',
      'teeth cleaning & whitening specials',
      'new patient dental exam offers',
      'family dentistry discounts',
      'local dental care deals'
    ]
  },
  {
    id: 'optometry_vision',
    test: /\b(optometr\w*|eye\s+exam|eyewear|glasses|sunglasses|optician|vision\s+center|contact\s+lenses|lasik)\b/i,
    primaryNiche: 'Optometry, Eye Exams & Eyewear',
    categoryHeading: 'Optometry, Eye Exam & Glasses Deals',
    schemaType: 'Optician',
    keywords: [
      'optometrist deals',
      'eye exam coupons',
      'glasses & frames discounts',
      'contact lens specials',
      'vision care offers'
    ]
  },
  {
    id: 'chiro_pt_acupuncture',
    test: /\b(chiropract\w*|physical\s+therap\w*|physiotherap\w*|acupunctur\w*|sports\s+rehab|spinal\s+adjustment)\b/i,
    primaryNiche: 'Chiropractic, Physical Therapy & Rehab',
    categoryHeading: 'Chiropractic, Physical Therapy & Holistic Health Deals',
    schemaType: 'MedicalBusiness',
    keywords: [
      'chiropractor deals',
      'physical therapy coupons',
      'acupuncture specials',
      'spinal adjustment & pain relief offers',
      'sports rehab discounts'
    ]
  },
  {
    id: 'auto_repair',
    test: /\b(auto\s+repair|automotive|mechanic|smog|collision|brake|brakes|tire|tires|car\s+repair|body\s+shop|oil\s+change|transmission|motor|auto\s+body)\b/i,
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
    id: 'car_wash_detailing',
    test: /\b(car\s+wash|auto\s+detail\w*|car\s+detail\w*|ceramic\s+coating|window\s+tint\w*|paint\s+protection|ppf)\b/i,
    primaryNiche: 'Car Wash & Auto Detailing',
    categoryHeading: 'Auto Repair, Detailing & Car Service Deals',
    schemaType: 'AutoWash',
    keywords: [
      'car wash deals',
      'auto detailing coupons',
      'ceramic coating specials',
      'interior & exterior car detailing discounts',
      'window tinting offers'
    ]
  },
  {
    id: 'nail_salon',
    test: /\b(nail|nails|manicure|pedicure|mani-pedi|gel\s+nails|acrylic\s+nails|nail\s+spa|nail\s+bar|nail\s+salon|nail\s+saloon)\b/i,
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
    id: 'hair_barber',
    test: /\b(hair|haircut|haircuts|barber|barbershop|hair\s+salon|blowout|balayage|stylist|bestcuts|cuts|colorist|shave)\b/i,
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
    id: 'med_spa_wellness',
    test: /\b(med\s*(?:&|and)?\s*spa|medspa|medical\s+spa|med\s*(?:&|and)?\s*wellness|botox|filler\w*|injectable\w*|juvederm|dysport|hydrafacial|laser\s+(?:treatment|hair|skin|removal)|aesthetic\s+(?:medicine|procedure\w*)|derm\w*|b12)\b/i,
    primaryNiche: 'Med Spa, Aesthetics & Skin Treatments',
    categoryHeading: 'Med Spa, Skincare & Aesthetics Deals',
    schemaType: 'DaySpa',
    keywords: [
      'med spa deals',
      'aesthetic treatment specials',
      'Botox & filler discounts',
      'laser skincare coupons',
      'facial & regenerative wellness offers'
    ]
  },
  {
    id: 'holistic_wellness_coaching',
    test: /\b(reiki|energy\s+service|energy\s+healing|energetic\s+healing|sound\s+bath|chakra|breathwork|hypnotherap\w*|life\s+coach\w*|holistic\s+healing)\b/i,
    primaryNiche: 'Holistic Wellness, Skincare & Energy Healing',
    categoryHeading: 'Spa, Holistic Wellness & Self-Care Deals',
    schemaType: 'HealthAndBeautyBusiness',
    keywords: [
      'holistic wellness deals',
      'energy healing & Reiki specials',
      'skincare & facial coupons',
      'mind-body self-care discounts',
      'local wellness studio offers'
    ]
  },
  {
    id: 'spa_skincare_massage',
    test: /\b(day\s*spa|wellness\s+(?:spa|studio|lounge|center)|facial|facials|skincare|skin\s*care|esthetician|aesthetic\w*|massage|waxing|lash|lashes|brow|brows|spa)\b/i,
    primaryNiche: 'Spa, Massage & Skincare',
    categoryHeading: 'Spa, Massage, Skincare & Wellness Deals',
    schemaType: 'DaySpa',
    keywords: [
      'spa deals',
      'day spa coupons',
      'facial & skincare discounts',
      'massage therapy offers',
      'esthetician & beauty specials'
    ]
  },
  {
    id: 'medical_clinic_healthcare',
    test: /\b(medical\s+clinic|urgent\s+care|physician|primary\s+care|pediatric\w*|podiatr\w*|dermatolog\w*|audiolog\w*|hearing\s+aid|medical\s+group)\b/i,
    primaryNiche: 'Medical Clinic & Healthcare Services',
    categoryHeading: 'Medical, Vision & Healthcare Deals',
    schemaType: 'MedicalBusiness',
    keywords: [
      'medical clinic deals',
      'healthcare & doctor specials',
      'new patient exam discounts',
      'local clinic coupons'
    ]
  },
  {
    id: 'art_gallery_cultural',
    test: /\b(art\s+gallery|fine\s+art|paintings?\s+gallery|exhibitions|art\s+studio)\b/i,
    primaryNiche: 'Fine Art Gallery, Fashion & Creative Classes',
    categoryHeading: 'Art Gallery, Boutique & Creative Shopping Deals',
    schemaType: 'ArtGallery',
    keywords: [
      'art gallery deals',
      'fine art & paintings specials',
      'wearable fashion & boutique discounts',
      'painting class & workshop coupons',
      'local gallery events & offers'
    ]
  },
  {
    id: 'photography_creative_design',
    test: /\b(photography|photographer|videograph\w*|graphic\s+design|brand\s+identity|packaging\s+design|visual\s+communication|creative\s+studio|redline\s+design|print\s+shop|branding\s+agency)\b/i,
    primaryNiche: 'Creative Studio, Branding & Design Services',
    categoryHeading: 'Photography, Branding & Creative Service Deals',
    schemaType: 'ProfessionalService',
    keywords: [
      'brand identity & graphic design deals',
      'packaging design discounts',
      'creative studio coupons',
      'photography & visual design specials',
      'business branding offers'
    ]
  },
  {
    id: 'home_organizing_cleaning',
    test: /\b(home\s+organiz\w*|professional\s+organiz\w*|declutter\w*|downsiz\w*|unpack\w*|house\s+cleaning|maid\s+service|home\s+cleaning|window\s+cleaning|pressure\s+washing|carpet\s+cleaning)\b/i,
    primaryNiche: 'Home Organizing, Decluttering & Home Care',
    categoryHeading: 'Home Organizing, Cleaning & Trade Service Deals',
    schemaType: 'HomeAndConstructionBusiness',
    keywords: [
      'home organizing deals',
      'professional organizer specials',
      'decluttering & home organization discounts',
      'house cleaning & maintenance coupons',
      'local home service offers'
    ]
  },
  {
    id: 'home_services_remodeling',
    test: /\b(kitchen\s*(?:&|and)\s*bath|kitchen\s+remodel\w*|bath(?:room)?\s+remodel\w*|baths|remodel|remodeling|renovation|water\s+system|water\s+systems|filtration|plumbing|plumber|hvac|air\s+conditioning|roofing|solar|flooring|cabinets|contractor|home\s+improvement|handyman|landscaping|pest\s+control|pool\s*(?:&|and)?\s*spa|hot\s+tub|pool\s+service|electrician)\b/i,
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
    id: 'education_tutoring_stem',
    test: /\b(stem|stemtree|tutor|tutoring|academic\s+enrichment|learning\s+center|coding\s+(?:class\w*|camp\w*|academy|school|for\s+kids)|robotics|math\s+(?:tutor\w*|class\w*|program\w*)|science\s+(?:tutor\w*|camp\w*|class\w*)|test\s+prep|sat\s+prep|music\s+school|music\s+lessons|preschool|montessori)\b/i,
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
    test: /\b(gym|fitness|yoga|pilates|crossfit|workout|personal\s+training|martial\s+arts|karate|jiu\s+jitsu|kickboxing|barre)\b/i,
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
    id: 'smoothie_juice_acai',
    test: /\b(juicy|juice|smoothie|smoothies|acai|açaí|bowl|bowls|pressed\s+juice)\b/i,
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
    test: /\b(coffee|espresso|roaster|roasters|chai|tea|matcha|latte|boba|cafe|café)\b/i,
    primaryNiche: 'Coffee, Specialty Tea & Cafe',
    categoryHeading: 'Smoothie, Juice Bar, Coffee & Cafe Deals',
    schemaType: 'CafeOrCoffeeShop',
    keywords: [
      'coffee shop deals',
      'cafe coupons',
      'specialty tea & chai discounts',
      'latte & matcha specials',
      'local coffeehouse offers'
    ]
  },
  {
    id: 'bakery_sweets_dessert',
    test: /\b(sweets|bakery|bakeshop|pastry|pastries|cookie|cookies|cake|cakes|cupcake|dessert|desserts|ice\s+cream|gelato|chocolate|confection|sourdough|jams|preserves)\b/i,
    primaryNiche: 'Bakery, Desserts & Specialty Treats',
    categoryHeading: 'Bakery, Desserts & Sweet Treat Deals',
    schemaType: 'Bakery',
    keywords: [
      'bakery deals',
      'dessert & specialty sweets coupons',
      'homemade jams & treats discounts',
      'pastries & baked goods specials',
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
    id: 'restaurant_dining',
    test: /\b(restaurant|dining|grill|bistro|taco|tacos|mexican|pizza|pizzeria|italian|sushi|ramen|thai|mediterranean|burger|burgers|bbq|deli|eatery|food\s+truck|catering|brunch|breakfast|diner|pancake|pancakes|waffle|omelet|omelette|yolk|steakhouse|seafood|burrito|burritos)\b/i,
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
    id: 'grocery_gourmet_superfoods',
    test: /\b(grocery|gourmet\s+market|butcher|sea\s+moss|seamoss|superfood\w*|organic\s+market|farmers\s+market|health\s+food|specialty\s+food|vitamins|supplements)\b/i,
    primaryNiche: 'Gourmet Market, Grocery & Natural Superfoods',
    categoryHeading: 'Grocery, Gourmet Market & Natural Food Deals',
    schemaType: 'GroceryStore',
    keywords: [
      'gourmet market deals',
      'specialty grocery coupons',
      'sea moss & natural superfood discounts',
      'organic food market specials',
      'local grocery offers'
    ]
  },
  {
    id: 'pet_services',
    test: /\b(pet|dog|cat|grooming|groomer|boarding|doggy\s+daycare|pet\s+supply|pet\s+store|dog\s+walker)\b/i,
    primaryNiche: 'Pet Grooming & Pet Care',
    categoryHeading: 'Pet Care, Grooming & Veterinary Deals',
    schemaType: 'LocalBusiness',
    keywords: [
      'pet grooming deals',
      'dog grooming coupons',
      'pet store discounts',
      'doggy daycare & boarding specials'
    ]
  },
  {
    id: 'dry_cleaning_tailor',
    test: /\b(dry\s+clean\w*|laundry|laundromat|tailor|alterations)\b/i,
    primaryNiche: 'Dry Cleaning, Laundry & Alterations',
    categoryHeading: 'Dry Cleaning, Tailoring & Local Service Deals',
    schemaType: 'DryCleaningOrLaundry',
    keywords: [
      'dry cleaning deals',
      'alterations & tailoring coupons',
      'laundry service discounts',
      'local cleaners specials'
    ]
  },
  {
    id: 'florist_gifts',
    test: /\b(florist|flower\s+shop|flowers|floral|bouquet|gift\s+shop|gift\s+basket\w*)\b/i,
    primaryNiche: 'Florist, Bouquets & Gift Shop',
    categoryHeading: 'Florist, Gift Shop & Boutique Deals',
    schemaType: 'Florist',
    keywords: [
      'florist deals',
      'flower delivery coupons',
      'bouquet & floral arrangement discounts',
      'local gift shop offers'
    ]
  },
  {
    id: 'entertainment_recreation',
    test: /\b(arcade|escape\s+room|bowling|mini\s+golf|golf\s+simulator|entertainment|trampoline|amusement|event\s+venue|cinema)\b/i,
    primaryNiche: 'Entertainment, Games & Recreation',
    categoryHeading: 'Entertainment & Recreation Deals',
    schemaType: 'EntertainmentBusiness',
    keywords: [
      'entertainment deals',
      'recreation & activity coupons',
      'family fun discounts',
      'local event & venue specials'
    ]
  },
  {
    id: 'financial_legal_realestate',
    test: /\b(cpa|tax\s+prep\w*|accounting|bookkeep\w*|financial\s+advis\w*|wealth\s+management|insurance|real\s+estate|realtor|mortgage|escrow|attorney|law\s+firm|legal\s+services|notary)\b/i,
    primaryNiche: 'Financial, Tax, Legal & Real Estate Services',
    categoryHeading: 'Professional, Financial & Business Service Deals',
    schemaType: 'ProfessionalService',
    keywords: [
      'CPA & tax preparation deals',
      'financial advisory & insurance specials',
      'legal & real estate consultation offers',
      'local professional service discounts'
    ]
  },
  {
    id: 'business_consulting_tech',
    test: /\b(consulting|consultant|ucaas|telecom|voip|it\s+services|managed\s+it|cybersecurity|saas|marketing\s+agency|business\s+advisory|b2b)\b/i,
    primaryNiche: 'Business Consulting, IT & Telecom Services',
    categoryHeading: 'Professional, Financial & Business Service Deals',
    schemaType: 'ProfessionalService',
    keywords: [
      'business consulting deals',
      'UCaaS & cloud telecom specials',
      'IT & B2B service discounts',
      'free business consultation offers'
    ]
  },
  {
    id: 'apparel_fashion_retail',
    test: /\b(apparel|clothing|shirt|shirts|hawaiian|fashion|boutique|jewelry|shoes|footwear|handbag|handbags|trading\s+co|retail)\b/i,
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
  const dollarOffMatch = str.match(/\$\d[\d,]*(?:\.\d{1,2})?\s*off\b/i);
  if (dollarOffMatch) return dollarOffMatch[0].replace(/\s+/g, ' ').replace(/off/i, 'Off');

  const pctOffMatch = str.match(/\d+%\s*off\b/i);
  if (pctOffMatch) return pctOffMatch[0].replace(/\s+/g, ' ').replace(/off/i, 'Off');

  const pctContextMatch = str.match(/\b(\d{1,2})%\s+(?:any\b|first\b|all\b|your\b|entire\b|discount\b|on\b|for\b|select\b)/i);
  if (pctContextMatch) return `${pctContextMatch[1]}% Off`;

  const forPriceMatch = str.match(/\bfor\s+\$(\d[\d,]*(?:\.\d{1,2})?)\b/i) || str.match(/\$(\d[\d,]*(?:\.\d{1,2})?)\b/);
  if (forPriceMatch) return `$${forPriceMatch[1]} Special`;

  if (/\bbogo\b|buy\s+one\s+get\s+one/i.test(str)) return 'BOGO Deal';
  if (/\bfree\b.*\b(consultation|exam|assessment|evaluation|estimate|inspection|quote|class|session|trial)\b/i.test(str)) {
    return 'Free Consultation';
  }
  if (/\bfree\b/i.test(str)) return 'Free Bonus Perk';
  return 'Verified Deal';
}

function stripFreebieGiveaways(offerText, rawCat) {
  if (!offerText) return '';
  if (/cafe|bakery|dessert|restaurant|dining|grocery/i.test(rawCat || '')) {
    return offerText;
  }
  return String(offerText).replace(
    /\bfree\s+(?:cup\s+of\s+)?(?:coffee|tea|chai|drink|beverage|smoothie|cookie|pastry|gift|tote|bag|shirt|sample)\b/gi,
    ''
  );
}

function refineMatchedRule(rule, merchantText) {
  if (!rule) return rule;
  if (rule.id === 'dental_periodontics_ortho') {
    if (/\b(perio|periodont\w*|implant|implants|gum\s+care|gum\s+disease|gingiv\w*)\b/i.test(merchantText)) {
      return {
        ...rule,
        primaryNiche: 'Periodontist, Dental Implants & Dentist',
        keywords: [
          'perio dental deals',
          'periodontist & dental implants specials',
          'dental deals',
          'dentist coupons',
          'new patient dental exam offers',
          'gum care & periodontal treatment discounts',
          'dental implant consultation deals',
          'teeth cleaning & dental care specials'
        ]
      };
    }
    if (/\b(orthodont\w*|invisalign|braces)\b/i.test(merchantText)) {
      return {
        ...rule,
        primaryNiche: 'Orthodontist, Invisalign & Braces',
        keywords: [
          'orthodontist deals',
          'braces & Invisalign discounts',
          'dental deals',
          'dentist coupons',
          'orthodontic consultation specials',
          'teeth alignment offers'
        ]
      };
    }
  }
  if (rule.id === 'home_services_remodeling') {
    if (/\b(kitchen|bath|baths|bathroom|remodel\w*|renovat\w*|cabinet\w*)\b/i.test(merchantText)) {
      return {
        ...rule,
        primaryNiche: 'Kitchen & Bath Remodeling & Flooring',
        keywords: [
          'kitchen remodel deals',
          'bathroom remodel specials',
          'kitchen & bath remodeling discounts',
          'flooring & cabinet installation offers',
          'home improvement deals',
          'local remodeling contractor coupons'
        ]
      };
    }
    if (/\b(water\s+system\w*|water\s+filtrat\w*|water\s+soften\w*|reverse\s+osmosis)\b/i.test(merchantText)) {
      return {
        ...rule,
        primaryNiche: 'Water Filtration Systems & Home Improvement',
        keywords: [
          'water filtration system deals',
          'whole house water softener discounts',
          'reverse osmosis drinking water specials',
          'home improvement deals',
          'local water system coupons'
        ]
      };
    }
    if (/\b(pool\s*(?:&|and)?\s*spa|hot\s*tub|pool\s+service|pool\s+cleaning|jacuzzi)\b/i.test(merchantText)) {
      return {
        ...rule,
        primaryNiche: 'Pool & Spa Service & Maintenance',
        keywords: [
          'pool & spa service deals',
          'pool cleaning & maintenance coupons',
          'hot tub & spa repair specials',
          'home maintenance discounts'
        ]
      };
    }
    if (/\b(plumb\w*|drain|water\s+heater)\b/i.test(merchantText)) {
      return {
        ...rule,
        primaryNiche: 'Plumbing, Drain & Water Heater Service',
        keywords: [
          'plumber deals',
          'plumbing & drain cleaning coupons',
          'water heater repair specials',
          'emergency plumbing discounts'
        ]
      };
    }
    if (/\b(hvac|air\s+conditioning|heating|furnace|ac\s+repair)\b/i.test(merchantText)) {
      return {
        ...rule,
        primaryNiche: 'HVAC, Air Conditioning & Heating Service',
        keywords: [
          'HVAC & AC repair deals',
          'air conditioning tune-up coupons',
          'heating & furnace service specials',
          'home comfort discounts'
        ]
      };
    }
  }
  if (rule.id === 'coffee_tea_chai') {
    if (/\b(chai|matcha|tea|boba)\b/i.test(merchantText) && !/\b(coffee|espresso|roaster\w*)\b/i.test(merchantText)) {
      return {
        ...rule,
        primaryNiche: 'Specialty Chai, Matcha & Tea',
        keywords: [
          'chai & specialty tea deals',
          'ceremonial matcha discounts',
          'artisan tea & latte coupons',
          'cafe & tea shop specials',
          'local tea offers'
        ]
      };
    }
  }
  return rule;
}

const SPECIALTY_TERM_EXTRACTORS = [
  { test: /\bperiodontist\b|\bperiodontal\b/i, term: 'periodontist & gum care' },
  { test: /\bdental\s+implant/i, term: 'dental implants' },
  { test: /\bpreventive\s+gum\s+care\b/i, term: 'preventive gum care' },
  { test: /\bsmile\s+transformation/i, term: 'smile restoration' },
  { test: /\binvisalign\b/i, term: 'Invisalign clear aligners' },
  { test: /\bcollision\s+repair\b|\bauto\s+body\b/i, term: 'auto body & collision repair' },
  { test: /\bsmog\s+station\b|\bsmog\b/i, term: 'smog inspection' },
  { test: /\bwearable\s+fashion\b|\bdesigner\s+clothing\b/i, term: 'wearable fashion & boutique art' },
  { test: /\bpainting\s+classes\b|\bworkshops\b/i, term: 'painting classes & workshops' },
  { test: /\bhandbags\b/i, term: 'designer handbags' },
  { test: /\bbrand\s+identity\b/i, term: 'brand identity design' },
  { test: /\bpackaging\s+design\b/i, term: 'packaging design' },
  { test: /\bvisual\s+communication\b/i, term: 'visual communication' },
  { test: /\bdeclutter/i, term: 'home decluttering' },
  { test: /\bkitchens,\s*closets\b|\bhome\s+organization\b|\borganizing\s+your\s+home\b/i, term: 'closet, garage & kitchen organizing' },
  { test: /\bkitchen\s+(?:and|&)\s+bathroom\s+remodel/i, term: 'kitchen & bathroom remodeling' },
  { test: /\bflooring\s+installation/i, term: 'flooring installation' },
  { test: /\bsea\s*moss\b|\bseamoss\b/i, term: 'natural sea moss & ocean superfoods' },
  { test: /\bhomemade\s+jams\b|\bpreserves\b/i, term: 'homemade jams & fruit preserves' },
  { test: /\bmatcha\b/i, term: 'ceremonial matcha' },
  { test: /\breiki\b/i, term: 'Reiki energy healing' },
  { test: /\baesthetic\s+(?:medicine|procedure)/i, term: 'aesthetic medicine & injectables' },
  { test: /\bhawaiian\s+shirts\b/i, term: 'USA-made Hawaiian shirts' },
  { test: /\btandoori\b|\bbiryani\b/i, term: 'tandoori specialties & biryani' }
];

function extractDynamicSpecialtyTerms(bName, desc, offer) {
  const fullText = `${bName} ${desc} ${offer}`;
  const found = [];
  for (const item of SPECIALTY_TERM_EXTRACTORS) {
    if (item.test.test(fullText)) {
      found.push(item.term);
      if (found.length >= 4) break;
    }
  }
  return found;
}

function buildSmartBioSnippet(bName, desc) {
  if (!desc) return '';
  let clean = String(desc).replace(/\s+/g, ' ').trim();
  // Skip repetitive "Welcome to <Business Name> [in City][,|.|!]" intro if deeper bio follows
  const welcomePrefixRe = /^welcome\s+to\s+[^.!]+(?:[.,!]\s*|\s+(?:where|in)\s+)/i;
  if (welcomePrefixRe.test(clean) && clean.length > 140) {
    const firstSentenceEnd = clean.search(/[.!]\s+/);
    if (firstSentenceEnd > 0 && firstSentenceEnd < clean.length - 60) {
      clean = clean.slice(firstSentenceEnd + 1).trim();
      clean = clean.replace(/^(?:since|est\.?|established)\s+\d{4}[.,]?\s+/i, '').trim();
    }
  }
  if (clean.length <= 155) {
    return ' ' + clean.replace(/[.,;:\s]+$/, '') + '.';
  }
  const cut = clean.slice(0, 155);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = (lastSpace > 90 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:\s]+$/, '');
  return ' ' + trimmed + '.';
}

function fallbackRuleForCategory(rawCat) {
  const cat = (rawCat || '').trim();
  const map = [
    { re: /restaurants?\s*&\s*dining/i, id: 'restaurant_dining' },
    { re: /cafes?,?\s*bakery/i, id: 'coffee_tea_chai' },
    { re: /grocery|gourmet\s*market/i, id: 'grocery_gourmet_superfoods' },
    { re: /hair\s*&\s*barber/i, id: 'hair_barber' },
    { re: /beauty,?\s*spa\s*&\s*wellness/i, id: 'spa_skincare_massage' },
    { re: /fitness\s*&\s*movement/i, id: 'fitness_gym_yoga' },
    { re: /education\s*&\s*learning/i, id: 'education_tutoring_stem' },
    { re: /health\s*&\s*medical/i, id: 'medical_clinic_healthcare' },
    { re: /retail\s*&\s*boutiques/i, id: 'apparel_fashion_retail' },
    { re: /professional\s*&\s*financial/i, id: 'business_consulting_tech' },
    { re: /home,?\s*auto\s*&\s*trade/i, id: 'home_services_remodeling' },
    { re: /pet\s*care/i, id: 'pet_services' },
    { re: /entertainment\s*&\s*recreation/i, id: 'entertainment_recreation' },
    { re: /photography\s*&\s*creative/i, id: 'photography_creative_design' }
  ];
  for (const entry of map) {
    if (entry.re.test(cat)) {
      const rule = NICHE_RULES.find(r => r.id === entry.id);
      if (rule) return rule;
    }
  }
  return {
    id: 'local_business',
    primaryNiche: cat.replace(/^🏪\s*/, '') || 'Local Business',
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

function classifyMerchantSEO(m) {
  const bName = m.business_name || m.merchant_name || 'Local Business';
  const effectivePresence = m.business_presence || (!m.city && m.welcome_promo_code ? 'online' : '');
  const isOnlineOnlyNoCity = effectivePresence === 'online' && !m.city;
  const city = m.city || (isOnlineOnlyNoCity ? '' : 'Orange County');
  const state = m.state || 'CA';
  const zip = m.postal_code || '';
  const offer = m.welcome_offer_text || 'Exclusive Member Perk';
  const desc = m.promo_description || '';
  const rawCat = m.business_category || (isOnlineOnlyNoCity ? 'Online Shopping & Brand Perks' : 'Local Dining & Retail');

  const offerForMatching = stripFreebieGiveaways(offer, rawCat);
  const nameAndDesc = `${bName} ${desc}`;
  const nameDescOffer = `${bName} ${desc} ${offerForMatching}`;
  const combinedText = `${nameDescOffer} ${rawCat}`;

  let matchedRule = null;

  // Stage 0: Compound disambiguation guards (prevent keyword collisions across industries)
  if (/\b(pool\s*(?:&|and)?\s*spa|hot\s*tub|pool\s*service|pool\s*cleaning|jacuzzi)\b/i.test(nameDescOffer)) {
    matchedRule = NICHE_RULES.find(r => r.id === 'home_services_remodeling');
  } else if (/\b(veterinar\w*|vet\s+clinic|animal\s+hospital|animal\s+clinic|pet\s+hospital|pet\s+dental)\b/i.test(nameAndDesc)) {
    matchedRule = NICHE_RULES.find(r => r.id === 'veterinary_care');
  } else if (/\b(home\s+organiz\w*|professional\s+organiz\w*|declutter\w*|downsiz\w*|unpack\w*|house\s+cleaning|maid\s+service|home\s+cleaning|window\s+cleaning|pressure\s+washing|carpet\s+cleaning)\b/i.test(nameAndDesc)) {
    matchedRule = NICHE_RULES.find(r => r.id === 'home_organizing_cleaning');
  } else if (
    /\b(art\s+gallery|fine\s+art|paintings?\s+gallery)\b/i.test(nameAndDesc) ||
    (/\bgallery\b/i.test(bName) && !/\b(auto|car|tire|nail|hair|dental|eye|photo|photography|kitchen|bath|flooring|carpet)\b/i.test(`${bName} ${rawCat}`))
  ) {
    matchedRule = NICHE_RULES.find(r => r.id === 'art_gallery_cultural');
  }

  // Stage 1A: Match on business_name alone (highest-signal, zero bio noise)
  if (!matchedRule) {
    matchedRule = NICHE_RULES.find(r => r.test.test(bName));
  }

  // Stage 1: Match on business_name + full promo_description (immune to promo bonus noise)
  if (!matchedRule) {
    matchedRule = NICHE_RULES.find(r => r.test.test(nameAndDesc));
  }

  // Stage 2: Match including sanitized welcome_offer_text
  if (!matchedRule) {
    matchedRule = NICHE_RULES.find(r => r.test.test(nameDescOffer));
  }

  // Stage 3: Match including official business_category
  if (!matchedRule) {
    matchedRule = NICHE_RULES.find(r => r.test.test(combinedText));
  }

  // Guard: restaurants/brunch spots with "Cafe" in the name (e.g. "Broken Yolk Cafe")
  if (matchedRule && matchedRule.id === 'coffee_tea_chai') {
    const coreCopy = `${bName} ${offerForMatching} ${desc}`;
    const hasExplicitCoffeeTea = /\b(coffee|espresso|roaster|roasters|chai|tea|matcha|latte|cappuccino|boba)\b/i.test(coreCopy);
    const isDiningByCategoryOrCopy = /restaurant|dining/i.test(rawCat) ||
      /\b(restaurant|dining|grill|bistro|taco|tacos|mexican|pizza|pizzeria|italian|sushi|ramen|thai|mediterranean|burger|burgers|bbq|deli|eatery|catering|brunch|breakfast|diner|pancake|pancakes|waffle|omelet|omelette|yolk|steakhouse|seafood|burrito|burritos)\b/i.test(coreCopy);
    if (!hasExplicitCoffeeTea && isDiningByCategoryOrCopy) {
      matchedRule = NICHE_RULES.find(r => r.id === 'restaurant_dining') || matchedRule;
    }
  }

  // Fallback mapping across all 15 official signup/apply categories
  if (!matchedRule) {
    matchedRule = fallbackRuleForCategory(rawCat);
  }

  // Apply specialty sub-niche refinement (e.g., periodontist / dental implants vs general dentist)
  matchedRule = refineMatchedRule(matchedRule, `${bName} ${desc} ${offer}`);

  const dynamicTerms = extractDynamicSpecialtyTerms(bName, desc, offer);
  const serviceKeywords = [...matchedRule.keywords];
  dynamicTerms.forEach(term => {
    if (!serviceKeywords.some(k => k.toLowerCase() === term.toLowerCase())) {
      serviceKeywords.push(term);
    }
  });

  const shortOffer = extractShortOfferHook(offer);
  const localizedKeywords = [];

  if (city) {
    serviceKeywords.forEach(kw => {
      localizedKeywords.push(`${kw} in ${city}`);
      localizedKeywords.push(`${city} ${kw}`);
    });
  }

  const allKeywords = isOnlineOnlyNoCity
    ? [
        `${bName} promo code`,
        `${bName} discount code`,
        `${bName} deals`,
        `${bName} coupons`,
        `${bName} discounts`,
        ...serviceKeywords,
        'online promo codes',
        'verified brand deals',
        'Perkfinity'
      ].filter(Boolean)
    : [
        `${bName} deals`,
        `${bName} coupons`,
        `${bName} discounts`,
        `${bName} ${city}`,
        ...localizedKeywords.slice(0, 10),
        ...serviceKeywords,
        `${city} deals`,
        `${city} coupons`,
        zip ? `${zip} local deals` : null,
        'Perkfinity'
      ].filter(Boolean);

  const seen = new Set();
  const dedupedKeywords = allKeywords.filter(k => {
    const low = k.toLowerCase();
    if (seen.has(low)) return false;
    seen.add(low);
    return true;
  });

  const pageTitle = isOnlineOnlyNoCity
    ? `${bName} — ${matchedRule.primaryNiche} Promo Codes, Coupons & Deals (${shortOffer}) | Perkfinity`
    : `${bName} — ${matchedRule.primaryNiche} Deals & Coupons in ${city}, ${state} (${shortOffer}) | Perkfinity`;

  const cleanDescSnippet = buildSmartBioSnippet(bName, desc);
  const metaDescription = isOnlineOnlyNoCity
    ? `${offer} at ${bName}. Verified ${serviceKeywords.slice(0, 3).join(', ')}, promo codes & online brand perks on Perkfinity.${cleanDescSnippet}`
    : `${offer} at ${bName} in ${city}, ${state}${zip ? ' ' + zip : ''}. Verified ${serviceKeywords.slice(0, 3).join(', ')} on Perkfinity.${cleanDescSnippet}`;

  return {
    nicheId: matchedRule.id,
    primaryNiche: matchedRule.primaryNiche,
    categoryHeading: matchedRule.categoryHeading,
    schemaType: matchedRule.schemaType,
    shortOffer,
    pageTitle,
    metaDescription: metaDescription.slice(0, 310),
    metaKeywords: dedupedKeywords.slice(0, 20).join(', '),
    serviceKeywords
  };
}

module.exports = {
  NICHE_RULES,
  classifyMerchantSEO,
  extractShortOfferHook,
  resolveRegionHub
};
