const fs = require('fs');
const path = require('path');
const express = require('express');

const PORT = process.env.PORT || 3000;
const ASSET_BASE =
  'https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d';
const asset = (file) => `${ASSET_BASE}/${encodeURIComponent(file)}`;

// Data storage setup
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(file, fallback) {
  const filePath = path.join(DATA_DIR, file);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error loading ${file}:`, err);
  }
  fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
  return fallback;
}

function saveJson(file, data) {
  const filePath = path.join(DATA_DIR, file);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving ${file}:`, err);
  }
}

// Initial Data
const INITIAL_REVIEWS = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    rating: 5,
    flavor: 'Diet Classic',
    comment: 'The crispest zero-sugar soda I have ever tasted! Zero metallic aftertaste, just pure vibrant botanical energy.',
    date: '2026-09-28',
    verified: true,
  },
  {
    id: 2,
    name: 'Liam Vance',
    rating: 5,
    flavor: 'Zero Lime',
    comment: 'The lime zest hits with the sharpest, cleanest sparkle. Packaging is gorgeous and 100% recyclable!',
    date: '2026-09-30',
    verified: true,
  },
  {
    id: 3,
    name: 'Elena Rostova',
    rating: 5,
    flavor: 'Diet Classic',
    comment: 'Switched from generic diet sodas last month. My energy levels are steady and the micro-bubble fizz is unmatched.',
    date: '2026-10-02',
    verified: true,
  },
];

let reviews = loadJson('reviews.json', INITIAL_REVIEWS);
let orders = loadJson('orders.json', []);
let messages = loadJson('messages.json', []);
let subscribers = loadJson('subscribers.json', []);

const config = {
  brand: {
    name: 'Soda+',
    tagline: 'Pure Zero Refreshment',
    description: 'Crisp botanical extracts, ultra-fine effervescence, zero sugar, and infinitely recyclable craft aluminum cans.',
    founded: 2024,
    shippingThreshold: 15.00,
    shippingCost: 3.50,
  },
  models: {
    leaves: asset('leaves.glb'),
    cherry: asset('cherry.glb'),
    blueberry: asset('blueberry.glb'),
    can: asset('deit_soda2.glb'),
  },
  bubble: asset('bubble.png'),
  flavors: [
    {
      id: 'classic',
      name: 'Diet Classic',
      price: '$2.99',
      numericPrice: 2.99,
      subtitle: 'Wild Cherry & Alpine Botanicals',
      tag: 'Best Seller',
      card: asset('Green Soda.png'),
      texture: asset('green base color.jpg'),
      berry: 'cherry',
      theme: { inner: '#0b8a78', mid: '#044e3b', outer: '#011411' },
      nutrition: {
        calories: 0,
        totalFat: '0g',
        sodium: '15mg',
        totalCarbs: '0g',
        totalSugars: '0g',
        protein: '0g',
        caffeine: '35mg',
        vitaminB12: '100% DV',
      },
      ingredients: [
        'Carbonated Artesian Spring Water',
        'Organic Monk Fruit Extract',
        'Natural Wild Cherry Essence',
        'Alpine Pine Needle Distillate',
        'Citric Acid',
        'Natural Electrolytes (Potassium & Magnesium Citrate)',
        'Cyanocobalamin (Vitamin B12)'
      ],
      sensory: {
        sweetness: 'Smooth & subtle',
        carbonation: 'Micro-effervescent',
        finish: 'Clean & crisp botanical'
      }
    },
    {
      id: 'blue',
      name: 'Zero Lime',
      price: '$2.99',
      numericPrice: 2.99,
      subtitle: 'Key Lime & Mountain Blueberry',
      tag: 'New Edition',
      card: asset('Blue Soda.png'),
      texture: asset('blue base color.jpg'),
      berry: 'blueberry',
      theme: { inner: '#0b4f8a', mid: '#04294e', outer: '#010c14' },
      nutrition: {
        calories: 0,
        totalFat: '0g',
        sodium: '15mg',
        totalCarbs: '0g',
        totalSugars: '0g',
        protein: '0g',
        caffeine: '35mg',
        vitaminB12: '100% DV',
      },
      ingredients: [
        'Carbonated Artesian Spring Water',
        'Organic Monk Fruit Extract',
        'Cold-Pressed Key Lime Extract',
        'Wild Mountain Blueberry Infusion',
        'Tartaric Acid',
        'Natural Electrolytes (Zinc & Magnesium Glycinate)',
        'Cyanocobalamin (Vitamin B12)'
      ],
      sensory: {
        sweetness: 'Bright & zesty',
        carbonation: 'Crisp & sharp sparkle',
        finish: 'Refreshing cold citrus breeze'
      }
    },
  ],
  story: {
    hero: 'Reimagining Soda From The Ground Up',
    paragraphs: [
      'For decades, standard diet sodas made compromises: harsh artificial sweeteners like aspartame, synthetic dyes, and disposable plastic containers. We asked ourselves a simple question: What if pure refreshment didn’t require compromise?',
      'Soda+ was formulated with alpine botanical distillates, organic monk fruit, and naturally balanced electrolytes. Brewed with high-pressure micro-carbonation, each sip delivers a gentle, velvety fizz that wakes up your senses without bloating or sugar crashes.',
      'Crafted in small batches with 100% renewable geothermal and solar energy.'
    ],
    stats: [
      { label: 'Sugar & Calories', value: '0' },
      { label: 'Natural Electrolytes', value: '3x' },
      { label: 'Infinitely Recyclable', value: '100%' },
      { label: 'Customer Rating', value: '4.9★' }
    ]
  },
  eco: {
    title: 'Our Zero Footprint Pledge',
    intro: 'Every can is an investment in a cleaner, cooler planet.',
    pillars: [
      {
        title: '100% Recyclable Aluminum',
        desc: 'Aluminum can be recycled indefinitely without degradation. Over 75% of all aluminum ever produced is still in active circulation today.',
        badge: 'Zero Plastic'
      },
      {
        title: 'Solar & Geothermal Bottling',
        desc: 'Our bottling line operates entirely on grid-positive renewable energy, minimizing carbon emissions by 84% compared to standard bottling plants.',
        badge: 'Clean Energy'
      },
      {
        title: 'One Tree Per 12-Pack',
        desc: 'In partnership with Global Reforestation Initiative, every 12 cans purchased finances the planting and care of native trees in deforested biomes.',
        badge: 'Restoration'
      }
    ],
    metrics: {
      treesPlanted: 142580,
      plasticBottlesDiverted: 2840000,
      co2SavedKg: 512000
    }
  },
  awards: [
    { year: '2025', title: 'World Beverage Innovation Award', category: 'Best Low/No Sugar Drink' },
    { year: '2025', title: 'Global Sustainable Design Prize', category: 'Circular Packaging Excellence' },
    { year: '2024', title: 'Clean Label Certification', category: '100% Verified Botanical Purity' }
  ]
};

const app = express();
app.use(express.json());

// API Endpoints
app.get('/api/config', (_req, res) => {
  res.json(config);
});

// Reviews API
app.get('/api/reviews', (_req, res) => {
  res.json({
    ok: true,
    reviews,
    averageRating: 4.9,
    totalCount: reviews.length + 1240
  });
});

app.post('/api/reviews', (req, res) => {
  const { name, rating, flavor, comment } = req.body;
  if (!name || !comment) {
    return res.status(400).json({ ok: false, error: 'Name and comment are required.' });
  }

  const newReview = {
    id: Date.now(),
    name: name.trim().slice(0, 50),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    flavor: flavor || 'Diet Classic',
    comment: comment.trim().slice(0, 500),
    date: new Date().toISOString().split('T')[0],
    verified: true,
  };

  reviews.unshift(newReview);
  saveJson('reviews.json', reviews);

  res.status(201).json({
    ok: true,
    message: 'Thank you! Your review has been published.',
    review: newReview
  });
});

// Contact API
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Name, email, and message are required.' });
  }

  const newMsg = {
    id: 'MSG-' + Date.now().toString(36).toUpperCase(),
    name: name.trim(),
    email: email.trim(),
    subject: subject ? subject.trim() : 'General Inquiry',
    message: message.trim(),
    receivedAt: new Date().toISOString(),
  };

  messages.unshift(newMsg);
  saveJson('messages.json', messages);

  res.status(200).json({
    ok: true,
    message: 'Message sent! Our support team will get back to you within 24 hours.',
    ticketId: newMsg.id
  });
});

// Newsletter API
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ ok: false, error: 'Valid email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!subscribers.includes(cleanEmail)) {
    subscribers.push(cleanEmail);
    saveJson('subscribers.json', subscribers);
  }

  res.status(200).json({
    ok: true,
    message: 'Welcome to the inner circle! Use code REFRESH20 for 20% off your first order.',
    discountCode: 'REFRESH20'
  });
});

// Checkout API
app.post('/api/checkout', (req, res) => {
  const { items, customer, promoCode } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'Cart is empty.' });
  }

  // Calculate pricing
  let subtotal = 0;
  const verifiedItems = items.map((item) => {
    const flavor = config.flavors.find((f) => f.id === item.id) || config.flavors[0];
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const lineTotal = flavor.numericPrice * qty;
    subtotal += lineTotal;
    return {
      id: flavor.id,
      name: flavor.name,
      unitPrice: flavor.numericPrice,
      quantity: qty,
      total: lineTotal,
    };
  });

  let discountRate = 0;
  const promo = (promoCode || '').trim().toUpperCase();
  if (promo === 'REFRESH20' || promo === 'SODA20' || promo === 'ZERO') {
    discountRate = 0.20;
  }

  const discountAmount = subtotal * discountRate;
  const shipping = subtotal >= config.brand.shippingThreshold ? 0 : config.brand.shippingCost;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  const orderId = 'SODA-' + Math.floor(100000 + Math.random() * 900000);
  const deliveryDays = 2 + Math.floor(Math.random() * 2);
  const deliveryDate = new Date(Date.now() + deliveryDays * 86400000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const orderRecord = {
    orderId,
    createdAt: new Date().toISOString(),
    customer: customer || { name: 'Valued Guest', email: 'guest@soda.plus' },
    items: verifiedItems,
    pricing: {
      subtotal: Number(subtotal.toFixed(2)),
      discountRate,
      discountAmount: Number(discountAmount.toFixed(2)),
      shipping,
      total: Number(total.toFixed(2)),
      currency: 'USD'
    },
    deliveryDate,
    status: 'Confirmed & In Bottling Queue'
  };

  orders.unshift(orderRecord);
  saveJson('orders.json', orders);

  res.status(201).json({
    ok: true,
    message: 'Order placed successfully!',
    order: orderRecord
  });
});

// Order lookup API
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.orderId === req.params.id);
  if (!order) {
    return res.status(404).json({ ok: false, error: 'Order not found' });
  }
  res.json({ ok: true, order });
});

// Static files
const staticDir = fs.existsSync(path.join(__dirname, '..', 'frontend'))
  ? path.join(__dirname, '..', 'frontend')
  : __dirname;
app.use(express.static(staticDir));

app.listen(PORT, () => {
  console.log(`Soda+ server running on http://localhost:${PORT}`);
});
