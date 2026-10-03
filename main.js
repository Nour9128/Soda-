(() => {
  /* ==================== SELECTORS & DOM HELPERS ==================== */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const can = $('#product-model');
  const heroCenter = $('.hero-center');
  const berriesFG = $('.berries-container');
  const berriesBG = $('.berries-container-bg');
  const leavesBG = $('.leaves-container');
  const berries = $$('.berry');
  const leaves = $$('.leaf');

  const BERRY_FLOAT_DURATIONS = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10];
  const REPEL_RADIUS = 400;
  const REPEL_STRENGTH = -80;

  /* ==================== APPLICATION STATE ==================== */
  const state = {
    config: null,
    textures: {},
    isSwitching: false,
    spin: 0,
    autoRotate: false,
    autoRotateAngle: 0,
    mouse: { x: 0, y: 0, px: 0, py: 0 },
    smoothMouse: { x: 0, y: 0 },
    activeFlavorId: 'classic',
    soundEnabled: localStorage.getItem('soda_sound') !== 'false',
    cart: JSON.parse(localStorage.getItem('soda_cart') || '[]'),
    promoDiscount: 0,
    activeReviewRating: 5,
  };

  /* ==================== WEB AUDIO PROCEDURAL SYNTHESIZER ==================== */
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Realistic can opening crack + long fizzy effervescence
  function playCanPop() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Sharp metallic snap / crack
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(800, now);
      snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      snapGain.gain.setValueAtTime(0.5, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.09);

      // 2. High-pressure gas burst (filtered white noise)
      const bufferSize = ctx.sampleRate * 0.8;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(3500, now);
      bandpass.Q.setValueAtTime(1.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      whiteNoise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now + 0.02);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  // Soft fizzy bubble pop
  function playBubble() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = 600 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (_) {}
  }

  // Harmonic glass chime for UI interactions
  function playChime(freq = 520) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (_) {}
  }

  /* ==================== TOAST NOTIFICATIONS ==================== */
  function showToast(message, type = 'info') {
    const container = $('#toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '✨';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';

    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  /* ==================== BOOT & INITIALIZATION ==================== */
  fetch('/api/config')
    .then((res) => res.json())
    .then(init)
    .catch((err) => {
      console.error('Failed to load config', err);
      showToast('Offline mode loaded', 'info');
    });

  function init(config) {
    state.config = config;
    bindCanTextures();
    assignModelSources();
    renderCards();
    setupCarouselNav();
    initBerries();
    setupHeaderButtons();
    setup3DControls();
    setupModals();
    setupCart();
    setupReviews();
    setupContactForm();
    populateModalData();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(animate);
    setInterval(createBubble, 400);
  }

  function assignModelSources() {
    if (!state.config?.models) return;
    $$('[data-asset]').forEach((el) => {
      const url = state.config.models[el.dataset.asset];
      if (url) el.src = url;
    });
  }

  /* ==================== CAN TEXTURES & SHADERS ==================== */
  function bindCanTextures() {
    const runWarmup = async () => {
      try {
        for (const flavor of state.config.flavors) {
          state.textures[flavor.id] = await can.createTexture(flavor.texture);
        }
        const [classic, blue] = [state.textures.classic, state.textures.blue];
        const slot = can.model?.materials[0]?.pbrMetallicRoughness.baseColorTexture;
        if (slot && blue && classic) {
          slot.setTexture(blue);
          await new Promise(requestAnimationFrame);
          slot.setTexture(classic);
        }
      } catch (err) {
        console.warn('Texture preload note:', err);
      }
    };

    if (can.loaded) {
      runWarmup();
    } else {
      can.addEventListener('load', runWarmup, { once: true });
    }
  }

  function applyCanTexture(flavorId) {
    const texture = state.textures[flavorId];
    if (!can.model || !texture) return;
    can.model.materials.forEach((material) => {
      const slot = material.pbrMetallicRoughness.baseColorTexture;
      if (slot) slot.setTexture(texture);
    });
  }

  /* ==================== FLAVOR CARDS & CAROUSEL ==================== */
  function renderCards() {
    const container = $('#cards');
    container.innerHTML = '';
    state.config.flavors.forEach((flavor, index) => {
      const card = document.createElement('div');
      card.className = 'card' + (index === 0 ? ' active' : '');
      card.dataset.flavor = flavor.id;
      card.innerHTML = `
        <img src="${flavor.card}" alt="${flavor.name}">
        <div class="card-info">
          <span>${flavor.name}</span>
          <span>${flavor.price}</span>
        </div>
        <button class="card-quick-add" title="Quick add to cart">+ Add</button>
      `;

      // Click card to switch flavor
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('card-quick-add')) {
          e.stopPropagation();
          addToCart(flavor.id);
          playBubble();
          return;
        }
        onCardClick(card, flavor);
      });

      container.appendChild(card);
    });
  }

  function setupCarouselNav() {
    const prev = $('#prev-btn');
    const next = $('#next-btn');
    const cycle = (dir) => {
      if (state.isSwitching || !state.config?.flavors?.length) return;
      const cards = $$('.card');
      const activeIdx = cards.findIndex((c) => c.classList.contains('active'));
      const count = state.config.flavors.length;
      const nextIdx = (activeIdx + dir + count) % count;
      onCardClick(cards[nextIdx], state.config.flavors[nextIdx]);
    };
    if (prev) prev.addEventListener('click', () => { cycle(-1); playChime(480); });
    if (next) next.addEventListener('click', () => { cycle(1); playChime(560); });
  }

  function onCardClick(card, flavor) {
    if (state.isSwitching || card.classList.contains('active')) return;
    $$('.card').forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    state.activeFlavorId = flavor.id;
    updateHeroBuyText();
    switchFlavor(flavor);
    playCanPop();
  }

  function updateHeroBuyText() {
    const flavor = state.config?.flavors?.find((f) => f.id === state.activeFlavorId);
    const label = $('#hero-buy-text');
    if (label && flavor) {
      label.textContent = `Add ${flavor.name} (${flavor.price})`;
    }
  }

  /* ==================== FLAVOR SWITCH TRANSITION ==================== */
  function switchFlavor(flavor) {
    state.isSwitching = true;
    state.settled = 0;
    morphBackground(flavor.theme);
    spinCan(flavor);
    berries.forEach((berry) => animateBerrySwitch(berry, flavor));
  }

  function morphBackground({ inner, mid, outer }) {
    gsap.to(document.body, {
      '--bg-inner': inner,
      '--bg-mid': mid,
      '--bg-outer': outer,
      duration: 1.5,
      ease: 'power2.inOut',
    });
  }

  function spinCan(flavor) {
    const spin = { val: 0, blur: 0 };
    const update = () => {
      state.spin = spin.val;
      can.style.filter = `blur(${spin.blur}px)`;
    };

    gsap.to(spin, {
      val: 360, blur: 15, duration: 0.6, ease: 'power2.in', onUpdate: update,
      onComplete: () => {
        document.body.classList.toggle('blue-theme', flavor.id === 'blue');
        applyCanTexture(flavor.id);
        gsap.to(spin, {
          val: 720, blur: 0, duration: 1.5, ease: 'back.out(0.7)', onUpdate: update,
          onComplete: () => { state.spin = 0; can.style.filter = 'none'; },
        });
      },
    });
  }

  function animateBerrySwitch(berry, flavor) {
    const centerX = window.innerWidth / 2 - berry.offsetLeft - berry.offsetWidth / 2;
    const centerY = window.innerHeight / 2 - berry.offsetTop - berry.offsetHeight / 2;
    const { angle, baseX, baseY } = readBerry(berry);
    const nextX = (Math.random() - 0.5) * 200;
    const nextY = (Math.random() - 0.5) * 200;

    gsap.set(berry, { rotation: angle, x: baseX, y: baseY });

    gsap.timeline()
      .to(berry, {
        x: centerX, y: centerY, rotation: angle + 45, scale: 0.1, opacity: 0,
        duration: 0.5, ease: 'power2.in',
        onComplete: () => {
          berry.src = state.config.models[flavor.berry];
          heroCenter.style.zIndex = 50;
        },
      })
      .to(berry, { duration: 0.3 })
      .to(berry, {
        x: nextX, y: nextY, rotation: angle + 90, scale: 1, opacity: 1,
        duration: 0.9, ease: 'back.out(1.5)',
        onStart: () => { heroCenter.style.zIndex = 1; },
        onComplete: () => {
          Object.assign(berry.dataset, { angle: angle + 90, baseX: nextX, baseY: nextY, rx: 0, ry: 0 });
          if (++state.settled === berries.length) state.isSwitching = false;
        },
      });
  }

  /* ==================== FLOATING BERRIES & LEAVES ==================== */
  function initBerries() {
    berries.forEach((b) => {
      Object.assign(b.dataset, { rx: 0, ry: 0, baseX: 0, baseY: 0, angle: Math.random() * 360 });
    });
  }

  function readBerry(berry) {
    const num = (key) => parseFloat(berry.dataset[key]) || 0;
    return { rx: num('rx'), ry: num('ry'), angle: num('angle'), baseX: num('baseX'), baseY: num('baseY') };
  }

  function updateBerry(berry, i, time) {
    const rect = berry.getBoundingClientRect();
    const dx = state.mouse.px - (rect.left + rect.width / 2);
    const dy = state.mouse.py - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);

    let targetX = 0, targetY = 0, speed = 1;
    if (distance < REPEL_RADIUS) {
      const force = (REPEL_RADIUS - distance) / REPEL_RADIUS;
      targetX = (dx / distance) * force * REPEL_STRENGTH;
      targetY = (dy / distance) * force * REPEL_STRENGTH;
      speed = 1 + force * 5;
    }

    const cur = readBerry(berry);
    const rx = cur.rx + (targetX - cur.rx) * 0.1;
    const ry = cur.ry + (targetY - cur.ry) * 0.1;
    const angle = cur.angle + 0.2 * speed;
    Object.assign(berry.dataset, { rx, ry, angle });

    const phase = (time + i * 0.7) * ((Math.PI * 2) / BERRY_FLOAT_DURATIONS[i % 9]);
    const floatY = Math.sin(phase) * 15;
    const floatAngle = Math.cos(phase) * 6;
    berry.style.transform =
      `translate(${rx + cur.baseX}px, ${ry + cur.baseY + floatY}px) rotate(${angle + floatAngle}deg)`;
  }

  function updateLeaf(leaf, i, time) {
    const phase = (time + i * 1.2) * ((Math.PI * 2) / (10 + i * 2));
    const x = Math.cos(phase * 0.5) * 15;
    const y = Math.sin(phase) * 20;
    const angle = Math.sin(phase * 0.3) * 15;
    leaf.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
  }

  /* ==================== 3D FLOATING CONTROLS ==================== */
  function setup3DControls() {
    const btnAuto = $('#btn-auto-rotate');
    const btnReset = $('#btn-reset-view');
    const btnPop = $('#btn-pop-can');

    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        state.autoRotate = !state.autoRotate;
        btnAuto.classList.toggle('active', state.autoRotate);
        showToast(state.autoRotate ? 'Auto-Rotate: ON' : 'Auto-Rotate: OFF', 'info');
        playChime(640);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        state.autoRotate = false;
        if (btnAuto) btnAuto.classList.remove('active');
        state.smoothMouse.x = 0;
        state.smoothMouse.y = 0;
        can.cameraOrbit = '0deg 90deg 380%';
        playChime(500);
        showToast('Camera angle reset', 'info');
      });
    }

    if (btnPop) {
      btnPop.addEventListener('click', () => {
        playCanPop();
        // Shake can animation
        gsap.timeline()
          .to(can, { x: '+=10', duration: 0.05, yoyo: true, repeat: 5 })
          .to(can, { x: 0, duration: 0.1 });
        // Burst of 18 bubbles!
        for (let i = 0; i < 18; i++) {
          setTimeout(createBubble, i * 40);
        }
        showToast('⚡ PSSSHHH! Can cracked open!', 'success');
      });
    }
  }

  /* ==================== HEADER ACTIONS ==================== */
  function setupHeaderButtons() {
    // Sound FX Button
    const soundBtn = $('#sound-btn');
    const updateSoundIcon = () => {
      if (soundBtn) {
        soundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
        soundBtn.title = state.soundEnabled ? 'Sound FX: ON (Click to Mute)' : 'Sound FX: OFF (Click to Unmute)';
      }
    };
    updateSoundIcon();

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem('soda_sound', state.soundEnabled);
        updateSoundIcon();
        if (state.soundEnabled) playChime(700);
        showToast(state.soundEnabled ? 'Sound FX Enabled' : 'Sound FX Muted', 'info');
      });
    }

    // Logo Click
    const logo = $('#logo-btn');
    if (logo) {
      logo.addEventListener('click', (e) => {
        e.preventDefault();
        playBubble();
        showToast('Pure Zero Refreshment. Always.', 'info');
      });
    }

    // Hero Buy Button
    const heroBuyBtn = $('#hero-buy-btn');
    if (heroBuyBtn) {
      heroBuyBtn.addEventListener('click', () => {
        addToCart(state.activeFlavorId);
        playBubble();
        openCart();
      });
    }

    // Hero Nutrition Button
    const heroNutBtn = $('#hero-nutrition-btn');
    if (heroNutBtn) {
      heroNutBtn.addEventListener('click', () => {
        openModal('products-modal');
        playChime();
      });
    }

    // Award Badge Button
    const awardBadge = $('#hero-award-badge');
    if (awardBadge) {
      awardBadge.addEventListener('click', () => {
        openModal('awards-modal');
        playChime();
      });
    }

    // Nav Items
    $('#nav-products')?.addEventListener('click', () => { openModal('products-modal'); playChime(); });
    $('#nav-story')?.addEventListener('click', () => { openModal('story-modal'); playChime(); });
    $('#nav-eco')?.addEventListener('click', () => { openModal('eco-modal'); playChime(); });
    $('#nav-reviews')?.addEventListener('click', () => { openModal('reviews-modal'); playChime(); loadReviews(); });
    $('#contact-toggle-btn')?.addEventListener('click', () => { openModal('contact-modal'); playChime(); });
  }

  /* ==================== CART DRAWER ==================== */
  function setupCart() {
    $('#cart-toggle-btn')?.addEventListener('click', () => { openCart(); playChime(); });
    $('#close-cart-btn')?.addEventListener('click', () => { closeCart(); playChime(420); });
    $('#cart-overlay')?.addEventListener('click', () => { closeCart(); });
    $('#empty-cart-shop-btn')?.addEventListener('click', () => { closeCart(); });

    // Promo code apply
    $('#promo-btn')?.addEventListener('click', applyPromoCode);
    $('#promo-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyPromoCode();
      }
    });

    // Checkout button
    $('#checkout-start-btn')?.addEventListener('click', () => {
      if (state.cart.length === 0) {
        showToast('Your cart is empty! Add a can first.', 'error');
        return;
      }
      closeCart();
      openModal('checkout-modal');
      setupCheckoutView();
      playChime(600);
    });

    renderCart();
  }

  function openCart() {
    $('#cart-drawer')?.classList.add('open');
    $('#cart-overlay')?.classList.add('open');
  }

  function closeCart() {
    $('#cart-drawer')?.classList.remove('open');
    $('#cart-overlay')?.classList.remove('open');
  }

  function addToCart(flavorId, qty = 1) {
    const existing = state.cart.find((i) => i.id === flavorId);
    if (existing) {
      existing.quantity += qty;
    } else {
      state.cart.push({ id: flavorId, quantity: qty });
    }
    saveCart();
    renderCart();
    bumpCartBadge();

    const flavor = state.config?.flavors?.find((f) => f.id === flavorId);
    showToast(`Added ${flavor ? flavor.name : 'Soda+'} to cart!`, 'success');
  }

  function removeFromCart(flavorId) {
    state.cart = state.cart.filter((i) => i.id !== flavorId);
    saveCart();
    renderCart();
    playChime(400);
  }

  function updateQty(flavorId, delta) {
    const item = state.cart.find((i) => i.id === flavorId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(flavorId);
    } else {
      saveCart();
      renderCart();
      playBubble();
    }
  }

  function saveCart() {
    localStorage.setItem('soda_cart', JSON.stringify(state.cart));
  }

  function bumpCartBadge() {
    const badges = $$('.cart-badge');
    badges.forEach((b) => {
      b.classList.remove('bump');
      void b.offsetWidth;
      b.classList.add('bump');
      setTimeout(() => b.classList.remove('bump'), 300);
    });
  }

  function renderCart() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const headerBadge = $('#header-cart-badge');
    const drawerBadge = $('#drawer-cart-badge');
    if (headerBadge) headerBadge.textContent = count;
    if (drawerBadge) drawerBadge.textContent = count;

    const list = $('#cart-items-list');
    const emptyView = $('#cart-empty-view');
    if (!list || !emptyView) return;

    if (state.cart.length === 0) {
      emptyView.style.display = 'flex';
      list.innerHTML = '';
      updateCartSummary(0);
      return;
    }

    emptyView.style.display = 'none';
    list.innerHTML = '';

    let subtotal = 0;
    state.cart.forEach((item) => {
      const flavor = state.config?.flavors?.find((f) => f.id === item.id) || {
        name: 'Soda Can',
        numericPrice: 2.99,
        card: '',
      };
      const linePrice = flavor.numericPrice * item.quantity;
      subtotal += linePrice;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img class="cart-item-img" src="${flavor.card}" alt="${flavor.name}">
        <div class="cart-item-details">
          <div class="cart-item-name">${flavor.name}</div>
          <div class="cart-item-price">$${flavor.numericPrice.toFixed(2)} each</div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-qty-dec="${item.id}">−</button>
            <span class="qty-count">${item.quantity}</span>
            <button class="qty-btn" data-qty-inc="${item.id}">+</button>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 0.95rem;">$${linePrice.toFixed(2)}</div>
          <button class="cart-item-remove" data-remove="${item.id}" title="Remove item">✕</button>
        </div>
      `;

      row.querySelector(`[data-qty-dec="${item.id}"]`).addEventListener('click', () => updateQty(item.id, -1));
      row.querySelector(`[data-qty-inc="${item.id}"]`).addEventListener('click', () => updateQty(item.id, 1));
      row.querySelector(`[data-remove="${item.id}"]`).addEventListener('click', () => removeFromCart(item.id));

      list.appendChild(row);
    });

    updateCartSummary(subtotal);
  }

  function updateCartSummary(subtotal) {
    const threshold = state.config?.brand?.shippingThreshold || 15.00;
    const defaultShipping = state.config?.brand?.shippingCost || 3.50;

    const shipping = subtotal >= threshold || subtotal === 0 ? 0 : defaultShipping;
    const discount = subtotal * state.promoDiscount;
    const total = Math.max(0, subtotal - discount + shipping);

    $('#summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    $('#summary-shipping').textContent = subtotal >= threshold ? 'FREE' : `$${shipping.toFixed(2)}`;
    $('#summary-total').textContent = `$${total.toFixed(2)}`;

    const discountRow = $('#discount-row');
    if (state.promoDiscount > 0 && subtotal > 0) {
      discountRow.style.display = 'flex';
      $('#summary-discount').textContent = `-$${discount.toFixed(2)} (${state.promoDiscount * 100}%)`;
    } else {
      discountRow.style.display = 'none';
    }

    // Free shipping bar
    const shippingText = $('#shipping-text');
    const shippingFill = $('#shipping-fill');
    if (shippingText && shippingFill) {
      if (subtotal >= threshold) {
        shippingText.textContent = '🎉 You unlocked FREE Express Shipping!';
        shippingFill.style.width = '100%';
      } else {
        const remaining = (threshold - subtotal).toFixed(2);
        shippingText.textContent = `Add $${remaining} more for FREE shipping`;
        const pct = Math.min(100, (subtotal / threshold) * 100);
        shippingFill.style.width = `${pct}%`;
      }
    }
  }

  function applyPromoCode() {
    const input = $('#promo-input');
    const code = (input.value || '').trim().toUpperCase();
    if (!code) return;

    if (code === 'REFRESH20' || code === 'SODA20' || code === 'ZERO') {
      state.promoDiscount = 0.20;
      saveCart();
      renderCart();
      playChime(750);
      showToast('🎉 Promo code applied: 20% OFF!', 'success');
      input.value = '';
    } else {
      playChime(350);
      showToast('Invalid promo code. Try: REFRESH20', 'error');
    }
  }

  /* ==================== UNIVERSAL MODAL SYSTEM ==================== */
  function setupModals() {
    $$('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeModal(btn.dataset.closeModal);
        playChime(420);
      });
    });

    $$('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
          playChime(420);
        }
      });
    });
  }

  function openModal(id) {
    const modal = $(`#${id}`);
    if (modal) modal.classList.add('open');
  }

  function closeModal(id) {
    const modal = $(`#${id}`);
    if (modal) modal.classList.remove('open');
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      closeCart();
      $$('.modal-overlay').forEach((m) => m.classList.remove('open'));
    }
    if (e.key === 'ArrowLeft') {
      $('#prev-btn')?.click();
    }
    if (e.key === 'ArrowRight') {
      $('#next-btn')?.click();
    }
  }

  /* ==================== POPULATE STATIC MODAL DATA ==================== */
  function populateModalData() {
    if (!state.config) return;

    // 1. Story Modal
    const storyBody = $('#story-modal-body');
    if (storyBody && state.config.story) {
      const { hero, paragraphs, stats } = state.config.story;
      storyBody.innerHTML = `
        <div class="story-hero-quote">"${hero}"</div>
        ${paragraphs.map((p) => `<p style="line-height: 1.6; color: var(--muted);">${p}</p>`).join('')}
        <div class="story-stats">
          ${stats.map((s) => `
            <div class="stat-box">
              <div class="stat-val">${s.value}</div>
              <div class="stat-lbl">${s.label}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 2. Eco Modal
    const ecoBody = $('#eco-modal-body');
    if (ecoBody && state.config.eco) {
      const { title, intro, pillars, metrics } = state.config.eco;
      ecoBody.innerHTML = `
        <p style="color: var(--muted); line-height: 1.5;">${intro}</p>
        <div class="eco-metrics">
          <div class="eco-box">
            <div class="eco-val">${metrics.treesPlanted.toLocaleString()}+</div>
            <div class="eco-lbl">Trees Planted</div>
          </div>
          <div class="eco-box">
            <div class="eco-val">${(metrics.plasticBottlesDiverted / 1000000).toFixed(1)}M</div>
            <div class="eco-lbl">Plastic Bottles Diverted</div>
          </div>
          <div class="eco-box">
            <div class="eco-val">${(metrics.co2SavedKg / 1000).toFixed(0)}k kg</div>
            <div class="eco-lbl">CO2 Emissions Saved</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem;">
          ${pillars.map((p) => `
            <div class="eco-pillar">
              <div class="eco-pillar-badge">${p.badge}</div>
              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">${p.title}</div>
                <div style="font-size: 0.82rem; color: var(--muted); margin-top: 2px;">${p.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 3. Awards Modal
    const awardsBody = $('#awards-modal-body');
    if (awardsBody && state.config.awards) {
      awardsBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${state.config.awards.map((a) => `
            <div class="eco-pillar" style="background: rgba(251, 191, 36, 0.06); border-color: rgba(251, 191, 36, 0.2);">
              <div class="modal-icon" style="color: var(--gold-accent);">🏆</div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <span style="font-weight: 800; font-size: 1rem;">${a.title}</span>
                  <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 100px; font-size: 0.7rem;">${a.year}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--muted); margin-top: 2px;">${a.category}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 4. Products / Nutrition Tab Setup
    setupNutritionTabs();
  }

  function setupNutritionTabs() {
    const tabs = $$('.flavor-tab');
    const content = $('#nutrition-tab-content');
    const addBtn = $('#nutrition-add-cart-btn');

    let currentTab = 'classic';
    const renderTab = (flavorId) => {
      currentTab = flavorId;
      tabs.forEach((t) => t.classList.toggle('active', t.dataset.flavorTab === flavorId));

      const flavor = state.config.flavors.find((f) => f.id === flavorId) || state.config.flavors[0];
      const nut = flavor.nutrition;

      $('#nutrition-flavor-name').textContent = flavor.name;

      content.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; background: var(--glass-bg); padding: 1rem; border-radius: 16px; border: 1px solid var(--glass-border);">
          <img src="${flavor.card}" style="width: 50px; height: 50px; object-fit: contain;">
          <div>
            <div style="font-weight: 800; font-size: 1.1rem;">${flavor.name}</div>
            <div style="font-size: 0.82rem; color: var(--muted);">${flavor.subtitle}</div>
          </div>
        </div>

        <div class="nutrition-grid">
          <div class="nutrition-card"><div class="nutrition-val">${nut.calories}</div><div class="nutrition-lbl">Calories</div></div>
          <div class="nutrition-card"><div class="nutrition-val">${nut.totalSugars}</div><div class="nutrition-lbl">Sugars</div></div>
          <div class="nutrition-card"><div class="nutrition-val">${nut.totalCarbs}</div><div class="nutrition-lbl">Net Carbs</div></div>
          <div class="nutrition-card"><div class="nutrition-val">${nut.caffeine}</div><div class="nutrition-lbl">Botanical Caffeine</div></div>
          <div class="nutrition-card"><div class="nutrition-val">${nut.vitaminB12}</div><div class="nutrition-lbl">Vitamin B12</div></div>
          <div class="nutrition-card"><div class="nutrition-val">${nut.sodium}</div><div class="nutrition-lbl">Electrolytes</div></div>
        </div>

        <div>
          <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.3rem;">Ingredients:</div>
          <div class="ingredients-pills">
            ${flavor.ingredients.map((ing) => `<span class="ingredient-tag">${ing}</span>`).join('')}
          </div>
        </div>
      `;
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        renderTab(tab.dataset.flavorTab);
        playChime(550);
      });
    });

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        addToCart(currentTab);
        playBubble();
        closeModal('products-modal');
        openCart();
      });
    }

    renderTab('classic');
  }

  /* ==================== REVIEWS SYSTEM ==================== */
  function setupReviews() {
    // Star Rating Picker
    const stars = $$('#star-picker span');
    stars.forEach((star) => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.star, 10);
        state.activeReviewRating = rating;
        stars.forEach((s, idx) => {
          s.style.color = idx < rating ? 'var(--gold-accent)' : 'rgba(255,255,255,0.2)';
        });
        playChime(400 + rating * 60);
      });
    });

    // Form submission
    const form = $('#new-review-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = $('#submit-review-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const payload = {
          name: $('#review-name').value,
          flavor: $('#review-flavor').value,
          rating: state.activeReviewRating,
          comment: $('#review-comment').value,
        };

        try {
          const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.ok) {
            showToast('Review submitted successfully!', 'success');
            playChime(800);
            form.reset();
            loadReviews();
          } else {
            showToast(data.error || 'Submission failed', 'error');
          }
        } catch (err) {
          showToast('Could not post review', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Publish Review';
        }
      });
    }
  }

  async function loadReviews() {
    const feed = $('#reviews-feed');
    if (!feed) return;
    feed.innerHTML = '<div style="color: var(--muted); font-size: 0.85rem; padding: 1rem;">Loading verified reviews...</div>';

    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (!data.ok || !data.reviews.length) {
        feed.innerHTML = '<div style="color: var(--muted);">No reviews yet. Be the first!</div>';
        return;
      }

      feed.innerHTML = data.reviews.map((r) => `
        <div class="review-item">
          <div class="review-item-header">
            <span class="review-author">
              ${r.name}
              ${r.verified ? '<span class="verified-tag">✓ Verified Buyer</span>' : ''}
            </span>
            <span style="color: var(--gold-accent);">${'★'.repeat(r.rating)}</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--accent); font-weight: 600;">Flavor: ${r.flavor}</div>
          <p class="review-comment">"${r.comment}"</p>
        </div>
      `).join('');
    } catch (err) {
      feed.innerHTML = '<div style="color: var(--muted);">Unable to load reviews right now.</div>';
    }
  }

  /* ==================== CONTACT FORM ==================== */
  function setupContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#contact-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Sending Message...';

      const payload = {
        name: $('#contact-name').value,
        email: $('#contact-email').value,
        subject: $('#contact-subject').value,
        message: $('#contact-message').value,
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok) {
          showToast(`Message sent! Ticket: ${data.ticketId}`, 'success');
          playChime(780);
          form.reset();
          closeModal('contact-modal');
        } else {
          showToast(data.error || 'Failed to send message', 'error');
        }
      } catch (err) {
        showToast('Error communicating with server', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Message';
      }
    });
  }

  /* ==================== CHECKOUT SYSTEM ==================== */
  function setupCheckoutView() {
    const formContainer = $('#checkout-form-container');
    const successView = $('#checkout-success-view');
    if (formContainer && successView) {
      formContainer.style.display = 'flex';
      successView.style.display = 'none';
    }

    // Payment methods selector
    const payCards = $$('.payment-card');
    payCards.forEach((c) => {
      c.addEventListener('click', () => {
        payCards.forEach((card) => card.classList.remove('active'));
        c.classList.add('active');
        playChime(500);
      });
    });

    // Update total label
    const totalLabel = $('#checkout-total-label');
    const currentTotal = $('#summary-total')?.textContent || '$0.00';
    if (totalLabel) totalLabel.textContent = currentTotal;

    // Form submit
    const form = $('#checkout-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = $('#confirm-order-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authorizing Payment...';

        const customer = {
          name: $('#ship-name').value,
          email: $('#ship-email').value,
          address: $('#ship-address').value,
          city: $('#ship-city').value,
          zip: $('#ship-zip').value,
          paymentMethod: $('.payment-card.active')?.dataset.pay || 'card',
        };

        try {
          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: state.cart,
              customer,
              promoCode: state.promoDiscount > 0 ? 'REFRESH20' : '',
            }),
          });
          const data = await res.json();
          if (data.ok) {
            // Success!
            state.cart = [];
            saveCart();
            renderCart();

            formContainer.style.display = 'none';
            successView.style.display = 'flex';
            $('#success-order-id').textContent = data.order.orderId;
            $('#success-delivery-date').textContent = `Estimated Arrival: ${data.order.deliveryDate}`;

            playCanPop();
            playChime(880);
            showToast('Order confirmed! Cold-chain dispatch initiated.', 'success');

            // Burst bubbles
            for (let i = 0; i < 24; i++) setTimeout(createBubble, i * 30);
          } else {
            showToast(data.error || 'Payment authorization failed', 'error');
          }
        } catch (err) {
          showToast('Checkout network error', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Authorize & Place Order';
        }
      };
    }

    // Success back button
    $('#success-continue-btn')?.addEventListener('click', () => {
      closeModal('checkout-modal');
      playBubble();
    });
  }

  /* ==================== MAIN ANIMATION LOOP ==================== */
  function onMouseMove(e) {
    state.mouse = {
      x: e.clientX / window.innerWidth - 0.5,
      y: e.clientY / window.innerHeight - 0.5,
      px: e.clientX,
      py: e.clientY,
    };
  }

  function animate() {
    const time = Date.now() * 0.001;
    const { mouse, smoothMouse } = state;

    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.05;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.05;

    // Handle auto-rotate if enabled
    if (state.autoRotate) {
      state.autoRotateAngle = (state.autoRotateAngle + 0.6) % 360;
    }

    const orbitYaw = smoothMouse.x * 40 + state.spin + state.autoRotateAngle;
    const orbitPitch = 90 + smoothMouse.y * 20;
    can.cameraOrbit = `${orbitYaw}deg ${orbitPitch}deg 380%`;

    berriesFG.style.transform = `translate(${smoothMouse.x * 60}px, ${smoothMouse.y * 60}px)`;
    berriesBG.style.transform = `translate(${smoothMouse.x * -30}px, ${smoothMouse.y * -30}px)`;
    leavesBG.style.transform = `translate(${smoothMouse.x * -15}px, ${smoothMouse.y * -15}px)`;

    if (!state.isSwitching) berries.forEach((b, i) => updateBerry(b, i, time));
    leaves.forEach((l, i) => updateLeaf(l, i, time));

    requestAnimationFrame(animate);
  }

  /* ==================== PROCEDURAL BUBBLE GENERATOR ==================== */
  function createBubble() {
    const container = $('#bubbles-container');
    if (!container) return;
    const bubble = document.createElement('img');
    const duration = Math.random() * 6 + 4;
    bubble.src = state.config?.bubble || 'https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/bubble.png';
    bubble.className = 'bubble-img';
    Object.assign(bubble.style, {
      width: `${Math.random() * 20 + 10}px`,
      height: 'auto',
      left: `${Math.random() * 100}%`,
      bottom: '-50px',
      opacity: Math.random() * 0.4 + 0.2,
      animation: `floatUpImg ${duration}s linear forwards`,
    });
    container.appendChild(bubble);
    setTimeout(() => bubble.remove(), duration * 1000);
  }
})();
