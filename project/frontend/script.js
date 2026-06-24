document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  let activeItem = { name: '', price: 0, type: '' };
  const detailItems = new Map();
  let allProducts = [];
  let allRepairs = [];
  let allOnlineServices = [];

  const header = document.querySelector('.header');
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const mobileOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileClose = document.querySelector('.mobile-nav-close');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  const navLinks = document.querySelectorAll('.nav-link');
  const requestModal = document.getElementById('request-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const detailsModal = document.getElementById('details-modal');
  const detailsModalCloseBtn = document.getElementById('details-modal-close-btn');
  const detailsModalBody = document.getElementById('details-modal-body');
  const requestForm = document.getElementById('request-form');
  const submitButton = document.getElementById('pay-button');
  const summaryItemName = document.getElementById('summary-item-name');
  const summaryItemType = document.getElementById('summary-item-type');
  const summaryItemPrice = document.getElementById('summary-item-price');
  const enquiryForm = document.getElementById('enquiry-form');
  const productSearch = document.getElementById('product-search');
  const productCompanyFilter = document.getElementById('product-company-filter');
  const productCategoryFilter = document.getElementById('product-category-filter');
  const productFilterReset = document.getElementById('product-filter-reset');
  const repairSearch = document.getElementById('repair-search');
  const repairFilterReset = document.getElementById('repair-filter-reset');
  const serviceSearch = document.getElementById('service-search');
  const serviceFilterReset = document.getElementById('service-filter-reset');

  const brandsContainer = document.getElementById('dynamic-brands-container');
  const bannerSlider = document.getElementById('hero-banner-slider');
  const productsContainer = document.getElementById('dynamic-products-container');
  const repairsContainer = document.getElementById('dynamic-repairs-container');
  const servicesContainer = document.getElementById('dynamic-services-container');

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const formatAmount = (amount) => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 'On request';
    return `Rs ${numericAmount.toLocaleString('en-IN')}`;
  };

  const getDetailId = (type, item) => `${type}:${item._id || item.name}`;

  const renderEmpty = (container, message) => {
    if (!container) return;
    container.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>${escapeHtml(message)}</p></div>`;
    lucide.createIcons();
  };

  const setMobileNavOpen = (isOpen) => {
    if (!mobileOverlay || !mobileToggle) return;
    mobileOverlay.classList.toggle('open', isOpen);
    mobileOverlay.setAttribute('aria-hidden', String(!isOpen));
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-open', isOpen);
    if (isOpen && mobileClose) mobileClose.focus();
  };

  const applySettings = (settings) => {
    document.querySelectorAll('[data-setting]').forEach(node => {
      const key = node.dataset.setting;
      if (settings[key] !== undefined && settings[key] !== '') {
        node.textContent = settings[key];
      }
    });

    if (settings.themeColor) {
      document.documentElement.style.setProperty('--primary', settings.themeColor);
    }

    if (settings.metaTitle) document.title = settings.metaTitle;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta && settings.metaDescription) {
      descriptionMeta.setAttribute('content', settings.metaDescription);
    }

    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta && settings.keywords) {
      keywordsMeta.setAttribute('content', settings.keywords);
    }

    const verificationMeta = document.querySelector('meta[name="google-site-verification"]');
    if (verificationMeta && settings.googleSiteVerification) {
      verificationMeta.setAttribute('content', settings.googleSiteVerification);
    }

    const phoneLink = document.getElementById('contact-phone-link');
    if (phoneLink && settings.phoneNumber) {
      phoneLink.href = `tel:${settings.phoneNumber}`;
    }
  };

  const groupByCompany = (products) => products
    .slice()
    .sort((a, b) => {
      const companySort = (a.companyId?.name || '').localeCompare(b.companyId?.name || '');
      if (companySort !== 0) return companySort;
      return a.name.localeCompare(b.name);
    })
    .reduce((groups, product) => {
      const company = product.companyId || {};
      const companyId = company._id || 'uncategorized';
      if (!groups[companyId]) {
        groups[companyId] = {
          company,
          products: []
        };
      }
      groups[companyId].products.push(product);
      return groups;
    }, {});

  const normalizeProductsResponse = (payload) => {
    if (Array.isArray(payload)) return payload;

    if (payload && Array.isArray(payload.products)) return payload.products;

    if (payload && typeof payload === 'object') {
      return Object.values(payload).flatMap(group => {
        if (Array.isArray(group)) return group;
        if (group && Array.isArray(group.products)) {
          return group.products.map(product => ({
            ...product,
            companyId: product.companyId || group.company
          }));
        }
        return [];
      });
    }

    return [];
  };

  const matchesText = (item, query, fields) => {
    if (!query) return true;
    const normalizedQuery = query.toLowerCase();
    return fields.some(field => String(field || '').toLowerCase().includes(normalizedQuery));
  };

  const populateProductFilters = (products) => {
    const companies = [...new Map(products
      .filter(product => product.companyId?.name)
      .map(product => [product.companyId._id || product.companyId.name, product.companyId])
    ).values()].sort((a, b) => a.name.localeCompare(b.name));

    const categories = [...new Set(products
      .map(product => product.category)
      .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    productCompanyFilter.innerHTML = `
      <option value="">All Companies</option>
      ${companies.map(company => `<option value="${escapeHtml(company._id || company.name)}">${escapeHtml(company.name)}</option>`).join('')}
    `;

    productCategoryFilter.innerHTML = `
      <option value="">All Categories</option>
      ${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}
    `;
  };

  const applyProductFilters = () => {
    const query = productSearch.value.trim();
    const company = productCompanyFilter.value;
    const category = productCategoryFilter.value;

    const filtered = allProducts.filter(product => {
      const companyId = product.companyId?._id || product.companyId?.name || '';
      const companyMatches = !company || companyId === company;
      const categoryMatches = !category || product.category === category;
      const textMatches = matchesText(product, query, [
        product.name,
        product.category,
        product.description,
        product.companyId?.name
      ]);
      return companyMatches && categoryMatches && textMatches;
    });

    renderProducts(filtered, 'No products match your filters');
  };

  const applyRepairFilters = () => {
    const query = repairSearch.value.trim();
    const filtered = allRepairs.filter(service => matchesText(service, query, [
      service.name,
      service.description,
      service.price
    ]));
    renderRepairs(filtered, 'No repair services match your search');
  };

  const applyServiceFilters = () => {
    const query = serviceSearch.value.trim();
    const filtered = allOnlineServices.filter(service => matchesText(service, query, [
      service.name,
      service.description,
      service.price
    ]));
    renderOnlineServices(filtered, 'No digital services match your search');
  };

  const loadStorefront = async () => {
    try {
      const [settingsRes, bannersRes, companiesRes, productsRes, servicesRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/banners?active=true'),
        fetch('/api/companies?active=true'),
        fetch('/api/products/public'),
        fetch('/api/services/public')
      ]);

      const settingsData = await settingsRes.json();
      const bannersData = await bannersRes.json();
      const companiesData = await companiesRes.json();
      const productsData = await productsRes.json();
      const servicesData = await servicesRes.json();

      if (settingsData.success) applySettings(settingsData.data || {});
      if (bannersData.success) renderBanners(bannersData.data || []);
      if (!companiesData.success) throw new Error(companiesData.message || 'Could not load companies.');
      if (!productsData.success) throw new Error(productsData.message || 'Could not load products.');
      if (!servicesData.success) throw new Error(servicesData.message || 'Could not load services.');

      const products = normalizeProductsResponse(productsData.data);
      console.log('Products public API response:', productsData);
      console.log('Product count for storefront render:', products.length);

      allProducts = products;
      renderBrands(companiesData.data || []);
      populateProductFilters(allProducts);
      renderProducts(allProducts);

      allRepairs = (servicesData.data || []).filter(service => service.type === 'repair');
      allOnlineServices = (servicesData.data || []).filter(service => service.type === 'online');
      renderRepairs(allRepairs);
      renderOnlineServices(allOnlineServices);
    } catch (err) {
      console.error('Failed to load storefront:', err);
      renderEmpty(brandsContainer, 'Could not load brands.');
      renderEmpty(productsContainer, 'Could not load products.');
      renderEmpty(repairsContainer, 'Could not load repair services.');
      renderEmpty(servicesContainer, 'Could not load online services.');
    }
  };

  const renderBanners = (banners) => {
    if (!bannerSlider || !banners.length) return;

    bannerSlider.innerHTML = banners.map((banner, index) => `
      <article class="hero-banner-slide ${index === 0 ? 'active' : ''}" style="background-image:url('${escapeHtml(banner.image)}')">
        <div class="hero-banner-overlay"></div>
        <div class="container hero-banner-content">
          <h2>${escapeHtml(banner.title)}</h2>
          <p>${escapeHtml(banner.subtitle || '')}</p>
        </div>
      </article>
    `).join('');

    if (banners.length < 2) return;

    let activeIndex = 0;
    const showSlide = (nextIndex) => {
      const slides = bannerSlider.querySelectorAll('.hero-banner-slide');
      if (!slides.length) return;
      slides[activeIndex].classList.remove('active');
      activeIndex = (nextIndex + slides.length) % slides.length;
      slides[activeIndex].classList.add('active');
    };

    setInterval(() => {
      showSlide(activeIndex + 1);
    }, 5000);

    let touchStartX = 0;
    bannerSlider.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    bannerSlider.addEventListener('touchend', e => {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) < 40) return;
      showSlide(activeIndex + (deltaX < 0 ? 1 : -1));
    }, { passive: true });
  };

  const renderBrands = (companies) => {
    if (!companies.length) {
      renderEmpty(brandsContainer, 'No brands available yet.');
      return;
    }

    brandsContainer.innerHTML = companies
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(company => `
      <div class="card product-card">
        <div class="product-icon-wrap">
          ${company.logo
            ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)}" loading="lazy" decoding="async" style="width:56px;height:56px;object-fit:contain">`
            : '<i data-lucide="badge-check" class="product-svg"></i>'}
        </div>
        <div class="card-body">
          <h3>${escapeHtml(company.name)}</h3>
        </div>
      </div>
    `).join('');
    lucide.createIcons();
  };

  const renderProducts = (products, emptyMessage = 'Products not available') => {
    console.log('renderProducts called with count:', Array.isArray(products) ? products.length : 0);

    if (!products.length) {
      renderEmpty(productsContainer, emptyMessage);
      return;
    }

    products.forEach(product => detailItems.set(getDetailId('product', product), { ...product, type: 'product' }));

    const groups = groupByCompany(products);
    productsContainer.innerHTML = Object.values(groups).map(group => `
      <div style="grid-column:1/-1; margin-top:18px">
        <h3 style="font-size:24px; margin-bottom:18px">${escapeHtml(group.company.name || 'Other Products')}</h3>
        <div class="grid grid-4">
          ${group.products.map(product => `
            <article class="card product-card detail-card" data-detail-id="${escapeHtml(getDetailId('product', product))}" role="button" tabindex="0" aria-label="View details for ${escapeHtml(product.name)}">
              ${product.isBestSeller ? '<div class="card-badge">Best Seller</div>' : ''}
              <div class="product-icon-wrap">
                ${product.image
                  ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover">`
                  : '<i data-lucide="package" class="product-svg"></i>'}
              </div>
              <div class="card-body">
                <h3>${escapeHtml(product.name)}</h3>
                <p class="product-desc">${escapeHtml(product.description || product.category || '')}</p>
                <div class="price-wrap">
                  <span class="price-label">Price</span>
                  <span class="price">${formatAmount(product.price)}</span>
                </div>
                <button class="btn btn-primary btn-full request-order-btn" data-item="${escapeHtml(product.name)}" data-price="${Number(product.price) || 0}" data-type="product">
                  Request Order <i data-lucide="send" class="icon-right"></i>
                </button>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `).join('');
    lucide.createIcons();
  };

  const renderRepairs = (repairs, emptyMessage = 'Services not available') => {
    if (!repairs.length) {
      renderEmpty(repairsContainer, emptyMessage);
      return;
    }

    repairs.forEach(service => detailItems.set(getDetailId('repair', service), { ...service, type: 'repair' }));

    repairsContainer.innerHTML = repairs.map(service => `
      <article class="card service-card detail-card" data-detail-id="${escapeHtml(getDetailId('repair', service))}" role="button" tabindex="0" aria-label="View details for ${escapeHtml(service.name)}">
        <div class="service-icon"><i data-lucide="wrench"></i></div>
        <h3>${escapeHtml(service.name)}</h3>
        <p>${escapeHtml(service.description || '')}</p>
        <div class="price-info">Starting from ${formatAmount(service.price)}</div>
        <button class="btn btn-secondary btn-full request-order-btn" data-item="${escapeHtml(service.name)}" data-price="${Number(service.price) || 0}" data-type="repair">
          Book Service <i data-lucide="arrow-right" class="icon-right"></i>
        </button>
      </article>
    `).join('');
    lucide.createIcons();
  };

  const renderOnlineServices = (services, emptyMessage = 'Services not available') => {
    if (!services.length) {
      renderEmpty(servicesContainer, emptyMessage);
      return;
    }

    services.forEach(service => detailItems.set(getDetailId('service', service), { ...service, type: 'service' }));

    servicesContainer.innerHTML = services.map(service => `
      <article class="card digital-card detail-card" data-detail-id="${escapeHtml(getDetailId('service', service))}" role="button" tabindex="0" aria-label="View details for ${escapeHtml(service.name)}">
        <div class="digital-icon"><i data-lucide="file-text"></i></div>
        <h3>${escapeHtml(service.name)}</h3>
        <p>${escapeHtml(service.description || '')}</p>
        <div class="price-badge">Charge: ${formatAmount(service.price)}</div>
        <button class="btn btn-primary btn-full request-order-btn" data-item="${escapeHtml(service.name)}" data-price="${Number(service.price) || 0}" data-type="service">
          Send Enquiry <i data-lucide="file-plus" class="icon-right"></i>
        </button>
      </article>
    `).join('');
    lucide.createIcons();
  };

  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    toast.innerHTML = `<i data-lucide="${icon}"></i><span class="toast-text">${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  };

  const openModal = (name, price, type) => {
    activeItem = { name, price: Number(price) || 0, type };
    summaryItemName.textContent = name;
    summaryItemType.textContent = type;
    summaryItemPrice.textContent = formatAmount(price);
    requestModal.classList.add('open');
    requestModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('cust-name').focus();
  };

  const openDetailsModal = (item) => {
    const isProduct = item.type === 'product';
    const isRepair = item.type === 'repair';
    const actionLabel = isProduct ? 'Request Order' : isRepair ? 'Book Service' : 'Send Enquiry';
    const icon = isProduct ? 'package' : isRepair ? 'wrench' : 'file-text';
    const companyName = item.companyId?.name || '';
    const description = item.description || (isProduct ? item.category : 'Details will be confirmed by AAR GLOBE.');

    detailsModalBody.innerHTML = `
      <div class="details-media">
        ${isProduct && item.image
          ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">`
          : `<i data-lucide="${icon}"></i>`}
      </div>
      <div class="details-content">
        <span class="details-kicker">${escapeHtml(isProduct ? companyName || 'Product' : isRepair ? 'Repair Service' : 'Digital Service')}</span>
        <h3 id="details-modal-title">${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(description)}</p>
        <div class="details-meta">
          ${isProduct ? `<div><span>Category</span><strong>${escapeHtml(item.category || 'Product')}</strong></div>` : ''}
          <div><span>Price</span><strong>${formatAmount(item.price)}</strong></div>
          <div><span>Status</span><strong>${item.isAvailable === false ? 'Currently unavailable' : 'Available'}</strong></div>
          ${item.isBestSeller ? '<div><span>Highlight</span><strong>Best Seller</strong></div>' : ''}
        </div>
        <button class="btn btn-primary btn-full btn-lg request-order-btn" data-item="${escapeHtml(item.name)}" data-price="${Number(item.price) || 0}" data-type="${escapeHtml(item.type)}">
          ${actionLabel} <i data-lucide="send" class="icon-right"></i>
        </button>
      </div>
    `;

    detailsModal.classList.add('open');
    detailsModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
    detailsModalCloseBtn.focus();
  };

  const closeDetailsModal = () => {
    detailsModal.classList.remove('open');
    detailsModal.setAttribute('aria-hidden', 'true');
    detailsModalBody.innerHTML = '';
    document.body.style.overflow = requestModal.classList.contains('open') ? 'hidden' : 'auto';
  };

  const setButtonLoading = (isLoading) => {
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner"></span> Submitting...';
      return;
    }

    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit Request <i data-lucide="send" class="icon-right"></i>';
    lucide.createIcons();
  };

  const closeModal = () => {
    requestModal.classList.remove('open');
    requestModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
    requestForm.reset();
    setButtonLoading(false);
  };

  const submitRequest = async ({ customerName, customerPhone, type, item, amount, message }) => {
    const res = await fetch('/api/orders/request-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, customerPhone, type, item, amount, message })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Could not submit request.');
    return data;
  };

  const showSuccessOverlay = (name) => {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
      <div class="success-circle"><i data-lucide="check"></i></div>
      <h2>Request Submitted</h2>
      <p>Thank you, ${escapeHtml(name)}.</p>
      <p style="margin: 10px 0; color: var(--text-muted)">Your request has been submitted. Shop owner will contact you soon.</p>
      <button class="btn btn-secondary" style="margin-top: 20px" onclick="this.parentElement.remove()">Close</button>
    `;
    document.body.appendChild(overlay);
    lucide.createIcons();
  };

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('nav-dark');
      header.style.background = 'rgba(11, 15, 25, 0.95)';
      header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    } else {
      header.classList.remove('nav-dark');
      header.style.background = 'rgba(255,255,255,0.72)';
      header.style.boxShadow = 'none';
    }
    updateActiveNavLink();
  });

  function updateActiveNavLink () {
    const sections = document.querySelectorAll('section');
    const scrollPos = window.scrollY + 150;
    sections.forEach(section => {
      if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
        const id = section.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }

  mobileToggle?.addEventListener('click', () => setMobileNavOpen(true));
  const closeMobileNav = () => setMobileNavOpen(false);
  mobileClose?.addEventListener('click', closeMobileNav);
  mobileLinks.forEach(link => link.addEventListener('click', closeMobileNav));
  mobileOverlay?.addEventListener('click', e => {
    if (e.target === mobileOverlay) closeMobileNav();
  });

  modalCloseBtn.addEventListener('click', closeModal);
  requestModal.addEventListener('click', e => {
    if (e.target === requestModal) closeModal();
  });
  detailsModalCloseBtn.addEventListener('click', closeDetailsModal);
  detailsModal.addEventListener('click', e => {
    if (e.target === detailsModal) closeDetailsModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (detailsModal.classList.contains('open')) closeDetailsModal();
    if (requestModal.classList.contains('open')) closeModal();
    if (mobileOverlay.classList.contains('open')) closeMobileNav();
  });

  document.body.addEventListener('click', e => {
    const btn = e.target.closest('.request-order-btn');
    if (btn) {
      e.stopPropagation();
      if (detailsModal.classList.contains('open')) closeDetailsModal();
      openModal(btn.dataset.item, btn.dataset.price, btn.dataset.type);
      return;
    }

    const card = e.target.closest('.detail-card');
    if (card) {
      const item = detailItems.get(card.dataset.detailId);
      if (item) openDetailsModal(item);
    }
  });

  document.body.addEventListener('keydown', e => {
    if (!['Enter', ' '].includes(e.key)) return;
    const card = e.target.closest('.detail-card');
    if (!card) return;
    e.preventDefault();
    const item = detailItems.get(card.dataset.detailId);
    if (item) openDetailsModal(item);
  });

  productSearch.addEventListener('input', applyProductFilters);
  productCompanyFilter.addEventListener('change', applyProductFilters);
  productCategoryFilter.addEventListener('change', applyProductFilters);
  productFilterReset.addEventListener('click', () => {
    productSearch.value = '';
    productCompanyFilter.value = '';
    productCategoryFilter.value = '';
    renderProducts(allProducts);
  });

  repairSearch.addEventListener('input', applyRepairFilters);
  repairFilterReset.addEventListener('click', () => {
    repairSearch.value = '';
    renderRepairs(allRepairs);
  });

  serviceSearch.addEventListener('input', applyServiceFilters);
  serviceFilterReset.addEventListener('click', () => {
    serviceSearch.value = '';
    renderOnlineServices(allOnlineServices);
  });

  requestForm.addEventListener('submit', async e => {
    e.preventDefault();

    const customerName = document.getElementById('cust-name').value.trim();
    const customerPhone = document.getElementById('cust-phone').value.trim();
    const message = document.getElementById('cust-message').value.trim();

    if (!customerName || !customerPhone) return showToast('Please fill in your name and phone number.', 'error');
    if (!/^[0-9]{10}$/.test(customerPhone)) return showToast('Please enter a valid 10-digit phone number.', 'error');

    setButtonLoading(true);

    try {
      await submitRequest({
        customerName,
        customerPhone,
        type: activeItem.type,
        item: activeItem.name,
        amount: activeItem.price,
        message
      });
      showSuccessOverlay(customerName);
    } catch (err) {
      showToast(err.message, 'error');
      setButtonLoading(false);
    }
  });

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', async e => {
      e.preventDefault();
      const submit = enquiryForm.querySelector('button[type="submit"]');
      const original = submit.innerHTML;
      const phone = document.getElementById('enquiry-phone').value.trim();
      if (!/^[0-9]{10}$/.test(phone)) return showToast('Please enter a valid 10-digit phone number.', 'error');

      try {
        submit.disabled = true;
        submit.innerHTML = '<span class="spinner"></span> Sending...';
        await submitRequest({
          customerName: document.getElementById('enquiry-name').value.trim(),
          customerPhone: phone,
          type: 'service',
          item: 'General enquiry',
          amount: '',
          message: document.getElementById('enquiry-message').value.trim()
        });
        showToast('Your request has been submitted. Shop owner will contact you soon.');
        enquiryForm.reset();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submit.disabled = false;
        submit.innerHTML = original;
        lucide.createIcons();
      }
    });
  }

  loadStorefront();
});
