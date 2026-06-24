document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const tokenKey = 'adminToken';
  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const adminMenuToggle = document.getElementById('admin-menu-toggle');
  const adminSidebar = document.getElementById('admin-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  let companiesData = [];
  let bannersData = [];
  let productsData = [];
  let servicesData = [];
  let ordersData = [];
  let activityLogsData = [];
  let latestAnalytics = null;

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const formatAmount = (amount) => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return '-';
    return `Rs ${numericAmount.toLocaleString('en-IN')}`;
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatDateInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  const renderNotificationHistory = (notifications = []) => {
    if (!notifications.length) return '<small class="notification-empty">No notifications yet</small>';

    return `
      <details class="notification-history">
        <summary>Notification History (${notifications.length})</summary>
        <ul>
          ${notifications.map(notification => `
            <li>
              <strong>${escapeHtml(notification.notificationType || notification.type)}</strong>
              <span>${formatDateTime(notification.sentAt || notification.createdAt)}</span>
              <p>${escapeHtml(notification.message)}</p>
            </li>
          `).join('')}
        </ul>
      </details>
    `;
  };

  const enhanceResponsiveTables = () => {
    document.querySelectorAll('.orders-table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      table.querySelectorAll('tbody tr').forEach(row => {
        Array.from(row.children).forEach((cell, index) => {
          if (headers[index]) cell.setAttribute('data-label', headers[index]);
        });
      });
    });
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem(tokenKey)}`
  });

  const uploadHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem(tokenKey)}`
  });

  const setAdminMenuOpen = (isOpen) => {
    adminSidebar.classList.toggle('open', isOpen);
    sidebarBackdrop.classList.toggle('open', isOpen);
    adminMenuToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('admin-nav-open', isOpen);
  };

  const api = async (url, options = {}) => {
    const res = await fetch(url, options);
    const data = await res.json();
    if (res.status === 401) {
      localStorage.removeItem(tokenKey);
      checkAuth();
    }
    if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');
    return data;
  };

  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}"></i> ${escapeHtml(message)}`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const validateImageFile = (file) => {
    if (!file) return true;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Only jpg, jpeg, png, and webp images are allowed', 'error');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be 5 MB or smaller', 'error');
      return false;
    }
    return true;
  };

  const previewImage = (fileInputId, previewId) => {
    const input = document.getElementById(fileInputId);
    const preview = document.getElementById(previewId);
    const file = input.files[0];
    if (!file) return;
    if (!validateImageFile(file)) {
      input.value = '';
      return;
    }
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  };

  const uploadImageIfSelected = async (fileInputId, endpoint, currentPath = '') => {
    const input = document.getElementById(fileInputId);
    const file = input.files[0];
    if (!file) return currentPath;
    if (!validateImageFile(file)) throw new Error('Invalid image file');

    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: uploadHeaders(),
      body: formData
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Image upload failed');
    return data.data.path;
  };

  const downloadExport = async (format) => {
    try {
      const range = document.getElementById('analytics-range')?.value || 'all';
      const res = await fetch(`/api/analytics/export/requests?format=${encodeURIComponent(format)}&range=${encodeURIComponent(range)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem(tokenKey)}` }
      });

      if (res.status === 401) {
        localStorage.removeItem(tokenKey);
        checkAuth();
        return;
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Export failed' }));
        throw new Error(error.message || 'Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aarglobe-requests-${range}.${format === 'excel' ? 'xls' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast(`Requests ${format === 'excel' ? 'Excel' : 'CSV'} exported`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const checkAuth = () => {
    if (localStorage.getItem(tokenKey)) {
      loginScreen.style.display = 'none';
      dashboardScreen.style.display = 'flex';
      document.body.classList.add('admin-authenticated');
      loadAll();
    } else {
      loginScreen.style.display = 'flex';
      dashboardScreen.style.display = 'none';
      document.body.classList.remove('admin-authenticated');
      setAdminMenuOpen(false);
    }
  };

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    loginBtn.disabled = true;
    loginBtn.innerHTML = 'Logging in...';

    try {
      const data = await api('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('login-email').value.trim(),
          password: document.getElementById('login-password').value
        })
      });
      localStorage.setItem(tokenKey, data.token || data.data.token);
      checkAuth();
    } catch (err) {
      loginError.textContent = err.message;
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Login <i data-lucide="log-in"></i>';
      lucide.createIcons();
    }
  });

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem(tokenKey);
    checkAuth();
  });

  const activateAdminTab = (tabName) => {
    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetLink = document.querySelector(`.sidebar-link[data-tab="${tabName}"]`);
    if (!targetTab || !targetLink) return;

    document.querySelectorAll('.sidebar-link[data-tab]').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    targetLink.classList.add('active');
    targetTab.classList.add('active');
    setAdminMenuOpen(false);
  };

  document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      activateAdminTab(link.dataset.tab);
    });
  });

  document.getElementById('global-admin-search')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const query = e.currentTarget.value.trim().toLowerCase();
    if (!query) return;
    const match = Array.from(document.querySelectorAll('.sidebar-link[data-tab]'))
      .find(link => link.textContent.trim().toLowerCase().includes(query));
    if (match) activateAdminTab(match.dataset.tab);
  });

  adminMenuToggle.addEventListener('click', () => setAdminMenuOpen(!adminSidebar.classList.contains('open')));
  sidebarBackdrop.addEventListener('click', () => setAdminMenuOpen(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setAdminMenuOpen(false);
  });

  const loadAll = async () => {
    await Promise.all([
      fetchCompanies(),
      fetchBanners(),
      fetchProducts(),
      fetchServices(),
      fetchOrders(),
      fetchSettings(),
      fetchAnalytics(),
      fetchActivityLogs()
    ]);
  };

  const getStatusClass = (value = '') => String(value).toLowerCase().replace(/\s+/g, '-');

  const fetchBanners = async () => {
    try {
      const data = await api('/api/banners');
      bannersData = data.data;
      renderBanners();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const renderBanners = () => {
    document.getElementById('banners-tbody').innerHTML = bannersData.map(banner => `
      <tr>
        <td>${banner.image ? `<img src="${escapeHtml(banner.image)}" alt="${escapeHtml(banner.title)}" class="table-thumb">` : '-'}</td>
        <td><strong>${escapeHtml(banner.title)}</strong></td>
        <td>${escapeHtml(banner.subtitle || '-')}</td>
        <td><span class="status-pill ${banner.isActive ? 'active' : 'inactive'}">${banner.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn btn-icon" onclick="editBanner('${banner._id}')" title="Edit"><i data-lucide="pencil"></i></button>
          <button class="btn btn-icon" onclick="deleteBanner('${banner._id}')" title="Delete"><i data-lucide="trash-2"></i></button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center; padding:30px">No banners yet.</td></tr>';
    lucide.createIcons();
    enhanceResponsiveTables();
  };

  document.getElementById('banner-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('banner-edit-id').value;

    let bannerImage = document.getElementById('banner-image').value;
    try {
      bannerImage = await uploadImageIfSelected('banner-image-file', '/api/upload/banner-image', bannerImage);
    } catch (err) {
      return showToast(err.message, 'error');
    }

    if (!bannerImage) return showToast('Banner image is required', 'error');

    const payload = {
      image: bannerImage,
      title: document.getElementById('banner-title').value.trim(),
      subtitle: document.getElementById('banner-subtitle').value.trim(),
      isActive: document.getElementById('banner-active').checked
    };

    try {
      await api(editId ? `/api/banners/${editId}` : '/api/banners', {
        method: editId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      showToast('Banner saved');
      resetBannerForm();
      await fetchBanners();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  const resetBannerForm = () => {
    document.getElementById('banner-form').reset();
    document.getElementById('banner-edit-id').value = '';
    document.getElementById('banner-image').value = '';
    document.getElementById('banner-image-preview').removeAttribute('src');
    document.getElementById('banner-image-preview').style.display = 'none';
    document.getElementById('banner-active').checked = true;
    document.getElementById('banner-cancel-btn').style.display = 'none';
  };

  document.getElementById('banner-cancel-btn').addEventListener('click', resetBannerForm);

  window.editBanner = (id) => {
    const banner = bannersData.find(item => item._id === id);
    if (!banner) return;
    document.getElementById('banner-edit-id').value = banner._id;
    document.getElementById('banner-title').value = banner.title;
    document.getElementById('banner-subtitle').value = banner.subtitle || '';
    document.getElementById('banner-image').value = banner.image || '';
    if (banner.image) {
      document.getElementById('banner-image-preview').src = banner.image;
      document.getElementById('banner-image-preview').style.display = 'block';
    }
    document.getElementById('banner-active').checked = banner.isActive;
    document.getElementById('banner-cancel-btn').style.display = 'inline-flex';
  };

  window.deleteBanner = async (id) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await api(`/api/banners/${id}`, { method: 'DELETE', headers: authHeaders() });
      showToast('Banner deleted');
      await fetchBanners();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await api('/api/companies');
      companiesData = data.data;
      renderCompanies();
      renderCompanyOptions();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const renderCompanyOptions = () => {
    const options = document.getElementById('company-options');
    options.innerHTML = companiesData
      .filter(company => company.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(company => `<option value="${escapeHtml(company.name)}"></option>`)
      .join('');
  };

  const getSelectedCompanyId = () => {
    const typedName = document.getElementById('prod-company-search').value.trim().toLowerCase();
    const company = companiesData.find(item => item.isActive && item.name.toLowerCase() === typedName);
    return company?._id || '';
  };

  const renderCompanies = () => {
    document.getElementById('companies-list').innerHTML = companiesData
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(company => `
        <div class="company-card">
          <div class="company-card-logo">
            ${company.logo ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)}">` : '<i data-lucide="building-2"></i>'}
          </div>
          <div class="company-card-body">
            <div class="company-card-title">
              <strong>${escapeHtml(company.name)}</strong>
              <span class="status-pill ${company.isActive ? 'active' : 'inactive'}">${company.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div class="company-stats">
              <span>Total: ${company.totalProducts || 0}</span>
              <span>Available: ${company.availableProducts || 0}</span>
              <span>Best Sellers: ${company.bestSellers || 0}</span>
            </div>
            <div class="company-actions">
              <button class="btn btn-icon" onclick="editCompany('${company._id}')" title="Edit"><i data-lucide="pencil"></i></button>
              <button class="btn btn-icon" onclick="disableCompany('${company._id}')" title="Disable"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
        </div>
      `).join('') || '<p style="color:var(--text-muted)">No companies yet.</p>';
    lucide.createIcons();
  };

  document.getElementById('company-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('company-edit-id').value;

    let companyLogo = document.getElementById('company-logo').value;
    try {
      companyLogo = await uploadImageIfSelected('company-logo-file', '/api/upload/company-logo', companyLogo);
    } catch (err) {
      return showToast(err.message, 'error');
    }

    const payload = {
      name: document.getElementById('company-name').value.trim(),
      logo: companyLogo,
      isActive: document.getElementById('company-active').checked
    };

    try {
      await api(editId ? `/api/companies/${editId}` : '/api/companies', {
        method: editId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      showToast('Company saved');
      resetCompanyForm();
      await fetchCompanies();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  const resetCompanyForm = () => {
    document.getElementById('company-form').reset();
    document.getElementById('company-edit-id').value = '';
    document.getElementById('company-logo').value = '';
    document.getElementById('company-logo-preview').removeAttribute('src');
    document.getElementById('company-logo-preview').style.display = 'none';
    document.getElementById('company-active').checked = true;
    document.getElementById('company-cancel-btn').style.display = 'none';
  };

  document.getElementById('company-cancel-btn').addEventListener('click', resetCompanyForm);

  window.editCompany = (id) => {
    const company = companiesData.find(item => item._id === id);
    if (!company) return;
    document.getElementById('company-edit-id').value = company._id;
    document.getElementById('company-name').value = company.name;
    document.getElementById('company-logo').value = company.logo || '';
    if (company.logo) {
      document.getElementById('company-logo-preview').src = company.logo;
      document.getElementById('company-logo-preview').style.display = 'block';
    }
    document.getElementById('company-active').checked = company.isActive;
    document.getElementById('company-cancel-btn').style.display = 'inline-flex';
  };

  window.disableCompany = async (id) => {
    if (!confirm('Disable this company? It will remain in the database.')) return;
    try {
      await api(`/api/companies/${id}`, { method: 'DELETE', headers: authHeaders() });
      showToast('Company disabled');
      await fetchCompanies();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api('/api/products', { headers: authHeaders() });
      productsData = data.data;
      renderProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const renderProducts = () => {
    const grouped = productsData.slice().sort((a, b) => {
      const companySort = (a.companyId?.name || '').localeCompare(b.companyId?.name || '');
      if (companySort !== 0) return companySort;
      return a.name.localeCompare(b.name);
    }).reduce((acc, product) => {
      const companyName = product.companyId?.name || 'Unassigned Company';
      if (!acc[companyName]) acc[companyName] = [];
      acc[companyName].push(product);
      return acc;
    }, {});

    document.getElementById('products-tbody').innerHTML = Object.entries(grouped).map(([companyName, products]) => `
      <tr class="company-group-row"><td colspan="7">${escapeHtml(companyName)}</td></tr>
      ${products.map(product => `
        <tr>
          <td><strong>${escapeHtml(product.name)}</strong></td>
          <td>${escapeHtml(product.companyId?.name || '-')}</td>
          <td>${escapeHtml(product.category)}</td>
          <td>${formatAmount(product.price)}</td>
          <td>${product.isAvailable ? 'Yes' : 'No'}</td>
          <td>${product.isBestSeller ? 'Yes' : 'No'}</td>
          <td>
            <button class="btn btn-icon" onclick="editProduct('${product._id}')" title="Edit"><i data-lucide="pencil"></i></button>
            <button class="btn btn-icon" onclick="deleteProduct('${product._id}')" title="Delete"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>
      `).join('')}
    `).join('') || '<tr><td colspan="7" style="text-align:center; padding:30px">No products yet.</td></tr>';

    document.getElementById('products-stat-total').textContent = productsData.length;
    document.getElementById('products-stat-available').textContent = productsData.filter(product => product.isAvailable).length;
    document.getElementById('products-stat-best').textContent = productsData.filter(product => product.isBestSeller).length;
    document.getElementById('products-card-grid').innerHTML = productsData.map(product => `
      <article class="product-admin-card">
        <div class="card-image product-card-media">
          ${product.image ? `<img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">` : '<i data-lucide="package"></i>'}
          <span class="status-pill ${product.isAvailable ? 'active' : 'inactive'}">${product.isAvailable ? 'Available' : 'Out of Stock'}</span>
        </div>
        <div class="card-content product-card-body">
          <span class="company-badge">${escapeHtml(product.companyId?.name || 'Unassigned')}</span>
          <h3 class="product-title">${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description || product.category || '-')}</p>
          <div class="product-meta">
            <strong>${formatAmount(product.price)}</strong>
            <span>${escapeHtml(product.category || 'Product')}</span>
          </div>
          <div class="quick-actions">
            <button class="btn btn-icon" onclick="editProduct('${product._id}')" title="Edit"><i data-lucide="pencil"></i></button>
            <button class="btn btn-icon" onclick="deleteProduct('${product._id}')" title="Delete"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      </article>
    `).join('') || '<div class="empty-state">No products yet.</div>';
    lucide.createIcons();
    enhanceResponsiveTables();
  };

  document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('prod-edit-id').value;
    const companyId = getSelectedCompanyId();
    if (!companyId) return showToast('Please select a valid company from the dropdown', 'error');

    let productImage = document.getElementById('prod-image').value;
    try {
      productImage = await uploadImageIfSelected('prod-image-file', '/api/upload/product-image', productImage);
    } catch (err) {
      return showToast(err.message, 'error');
    }

    const payload = {
      name: document.getElementById('prod-name').value.trim(),
      companyId,
      category: document.getElementById('prod-category').value.trim(),
      price: Number(document.getElementById('prod-price').value),
      image: productImage,
      description: document.getElementById('prod-desc').value.trim(),
      isAvailable: document.getElementById('prod-available').checked,
      isBestSeller: document.getElementById('prod-bestseller').checked
    };

    try {
      await api(editId ? `/api/products/${editId}` : '/api/products', {
        method: editId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      showToast('Product saved');
      resetProductForm();
      await Promise.all([fetchProducts(), fetchCompanies()]);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  const resetProductForm = () => {
    document.getElementById('add-product-form').reset();
    document.getElementById('prod-edit-id').value = '';
    document.getElementById('prod-company').value = '';
    document.getElementById('prod-image').value = '';
    document.getElementById('prod-image-preview').removeAttribute('src');
    document.getElementById('prod-image-preview').style.display = 'none';
    document.getElementById('prod-available').checked = true;
    document.getElementById('prod-cancel-btn').style.display = 'none';
  };

  document.getElementById('prod-cancel-btn').addEventListener('click', resetProductForm);

  window.editProduct = (id) => {
    const product = productsData.find(item => item._id === id);
    if (!product) return;
    document.getElementById('prod-edit-id').value = product._id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-company').value = product.companyId?._id || product.companyId;
    document.getElementById('prod-company-search').value = product.companyId?.name || '';
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-image').value = product.image || '';
    if (product.image) {
      document.getElementById('prod-image-preview').src = product.image;
      document.getElementById('prod-image-preview').style.display = 'block';
    }
    document.getElementById('prod-desc').value = product.description || '';
    document.getElementById('prod-available').checked = product.isAvailable;
    document.getElementById('prod-bestseller').checked = product.isBestSeller;
    document.getElementById('prod-cancel-btn').style.display = 'inline-flex';
  };

  window.deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api(`/api/products/${id}`, { method: 'DELETE', headers: authHeaders() });
      showToast('Product deleted');
      await Promise.all([fetchProducts(), fetchCompanies()]);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchServices = async () => {
    try {
      const data = await api('/api/services', { headers: authHeaders() });
      servicesData = data.data;
      renderServices();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const renderServices = () => {
    document.getElementById('services-tbody').innerHTML = servicesData.map(service => `
      <tr>
        <td><strong>${escapeHtml(service.name)}</strong></td>
        <td><span class="type-badge type-${service.type}">${escapeHtml(service.type)}</span></td>
        <td>${formatAmount(service.price)}</td>
        <td>${escapeHtml(service.description || '-')}</td>
        <td>${service.isAvailable ? 'Yes' : 'No'}</td>
        <td>
          <button class="btn btn-icon" onclick="editService('${service._id}')" title="Edit"><i data-lucide="pencil"></i></button>
          <button class="btn btn-icon" onclick="deleteService('${service._id}')" title="Delete"><i data-lucide="trash-2"></i></button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center; padding:30px">No services yet.</td></tr>';

    const renderServiceGroup = (title, icon, services) => `
      <section class="service-lane">
        <div class="service-lane-header"><i data-lucide="${icon}"></i><h3>${title}</h3><span>${services.length}</span></div>
        <div class="service-card-stack">
          ${services.map(service => `
            <article class="service-admin-card">
              <div>
                <span class="type-badge type-${service.type}">${escapeHtml(service.type)}</span>
                <h4>${escapeHtml(service.name)}</h4>
                <p>${escapeHtml(service.description || 'No description')}</p>
              </div>
              <div class="service-card-footer">
                <strong>${formatAmount(service.price)}</strong>
                <span class="status-pill ${service.isAvailable ? 'active' : 'inactive'}">${service.isAvailable ? 'Available' : 'Inactive'}</span>
                <button class="btn btn-icon" onclick="editService('${service._id}')" title="Edit"><i data-lucide="pencil"></i></button>
                <button class="btn btn-icon" onclick="deleteService('${service._id}')" title="Delete"><i data-lucide="trash-2"></i></button>
              </div>
            </article>
          `).join('') || '<div class="empty-state">No services in this group.</div>'}
        </div>
      </section>
    `;
    document.getElementById('services-card-grid').innerHTML = `
      ${renderServiceGroup('Repair Services', 'wrench', servicesData.filter(service => service.type === 'repair'))}
      ${renderServiceGroup('Online Services', 'file-text', servicesData.filter(service => service.type === 'online'))}
    `;
    lucide.createIcons();
    enhanceResponsiveTables();
  };

  document.getElementById('add-service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('svc-edit-id').value;
    const payload = {
      name: document.getElementById('svc-name').value.trim(),
      type: document.getElementById('svc-type').value,
      price: Number(document.getElementById('svc-price').value),
      description: document.getElementById('svc-desc').value.trim(),
      isAvailable: document.getElementById('svc-available').checked
    };

    try {
      await api(editId ? `/api/services/${editId}` : '/api/services', {
        method: editId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      showToast('Service saved');
      resetServiceForm();
      await fetchServices();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  const resetServiceForm = () => {
    document.getElementById('add-service-form').reset();
    document.getElementById('svc-edit-id').value = '';
    document.getElementById('svc-available').checked = true;
    document.getElementById('svc-cancel-btn').style.display = 'none';
  };

  document.getElementById('svc-cancel-btn').addEventListener('click', resetServiceForm);

  window.editService = (id) => {
    const service = servicesData.find(item => item._id === id);
    if (!service) return;
    document.getElementById('svc-edit-id').value = service._id;
    document.getElementById('svc-name').value = service.name;
    document.getElementById('svc-type').value = service.type;
    document.getElementById('svc-price').value = service.price;
    document.getElementById('svc-desc').value = service.description || '';
    document.getElementById('svc-available').checked = service.isAvailable;
    document.getElementById('svc-cancel-btn').style.display = 'inline-flex';
  };

  window.deleteService = async (id) => {
    if (!confirm('Delete this service?')) return;
    try {
      await api(`/api/services/${id}`, { method: 'DELETE', headers: authHeaders() });
      showToast('Service deleted');
      await fetchServices();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await api('/api/orders', { headers: authHeaders() });
      ordersData = data.data;
      renderOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const renderOrders = () => {
    const search = document.getElementById('search-phone').value.trim().toLowerCase();
    const type = document.getElementById('filter-type').value;
    const status = document.getElementById('filter-status').value;

    const filtered = ordersData.filter(order => {
      const matchesSearch = !search ||
        (order.customerName || '').toLowerCase().includes(search) ||
        (order.customerPhone || '').toLowerCase().includes(search);
      const matchesType = type === 'all' || order.type === type;
      const matchesStatus = status === 'all' || order.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });

    document.getElementById('orders-tbody').innerHTML = filtered.map(order => `
      <tr>
        <td>
          <strong>${escapeHtml(order.customerName)}</strong><br>
          <small>${formatDateTime(order.createdAt)}</small>
        </td>
        <td>
          ${escapeHtml(order.customerPhone)}<br>
          <button class="whatsapp-link send-whatsapp-btn" data-id="${order._id}">
            <i data-lucide="message-circle"></i> Send WhatsApp
          </button>
        </td>
        <td>
          <strong>${escapeHtml(order.item)}</strong><br>
          <span class="type-badge type-${order.type}">${escapeHtml(order.type)}</span>
          ${order.message ? `<p class="request-message">${escapeHtml(order.message)}</p>` : ''}
        </td>
        <td>
          <select class="status-select" data-id="${order._id}">
            ${['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'].map(item => `<option value="${item}" ${order.status === item ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
          <select class="lead-status-select" data-id="${order._id}" title="Lead Status">
            ${['New', 'Contacted', 'Qualified', 'Converted', 'Closed'].map(item => `<option value="${item}" ${order.leadStatus === item ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
        </td>
        <td>${formatDateTime(order.lastContactDate)}</td>
        <td>
          <input type="date" class="follow-date-input" data-id="${order._id}" value="${formatDateInput(order.nextFollowUpDate)}">
          <small>${formatDateTime(order.nextFollowUpDate)}</small>
        </td>
        <td>
          <div class="request-actions">
            <textarea class="notes-input" data-id="${order._id}" rows="2" placeholder="Status notes">${escapeHtml(order.notes || '')}</textarea>
            <textarea class="follow-notes-input" data-id="${order._id}" rows="2" placeholder="Follow-up note">${escapeHtml(order.followUpNotes || '')}</textarea>
            <div class="request-action-buttons">
              <button class="btn btn-icon save-notes-btn" data-id="${order._id}" title="Update Status"><i data-lucide="save"></i></button>
              <button class="btn btn-icon mark-contacted-btn" data-id="${order._id}" title="Mark Contacted"><i data-lucide="phone-call"></i></button>
              <button class="btn btn-icon save-follow-btn" data-id="${order._id}" title="Schedule Follow-up"><i data-lucide="calendar-clock"></i></button>
            </div>
            ${renderNotificationHistory(order.notificationHistory || [])}
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center; padding:30px">No requests found.</td></tr>';

    document.getElementById('requests-card-grid').innerHTML = filtered.map(order => `
      <article class="request-admin-card status-${getStatusClass(order.status)}">
        <div class="request-card-head">
          <div>
            <span class="section-kicker">${escapeHtml(order.type)}</span>
            <h3>${escapeHtml(order.customerName)}</h3>
            <p>${escapeHtml(order.customerPhone)}</p>
          </div>
          <span class="status-pill ${getStatusClass(order.status)}">${escapeHtml(order.status)}</span>
        </div>
        <div class="request-item-block">
          <strong>${escapeHtml(order.item)}</strong>
          <p>${escapeHtml(order.message || 'No message added')}</p>
        </div>
        <div class="request-card-meta">
          <span>Lead: ${escapeHtml(order.leadStatus || 'New')}</span>
          <span>Follow up: ${formatDateTime(order.nextFollowUpDate)}</span>
        </div>
        <div class="request-card-controls">
          <select class="status-select" data-id="${order._id}">
            ${['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'].map(item => `<option value="${item}" ${order.status === item ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
          <select class="lead-status-select" data-id="${order._id}" title="Lead Status">
            ${['New', 'Contacted', 'Qualified', 'Converted', 'Closed'].map(item => `<option value="${item}" ${order.leadStatus === item ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
        </div>
        <div class="request-action-buttons">
          <button class="whatsapp-link send-whatsapp-btn" data-id="${order._id}"><i data-lucide="message-circle"></i> WhatsApp</button>
          <button class="btn btn-icon mark-contacted-btn" data-id="${order._id}" title="Mark Contacted"><i data-lucide="phone-call"></i></button>
          <button class="btn btn-icon complete-request-btn" data-id="${order._id}" title="Mark Completed"><i data-lucide="check"></i></button>
          <button class="btn btn-icon save-notes-btn" data-id="${order._id}" title="Save Notes"><i data-lucide="save"></i></button>
        </div>
        <textarea class="notes-input" data-id="${order._id}" rows="2" placeholder="Status notes">${escapeHtml(order.notes || '')}</textarea>
        <textarea class="follow-notes-input" data-id="${order._id}" rows="2" placeholder="Follow-up note">${escapeHtml(order.followUpNotes || '')}</textarea>
        <input type="date" class="follow-date-input" data-id="${order._id}" value="${formatDateInput(order.nextFollowUpDate)}">
        <button class="btn btn-secondary save-follow-btn" data-id="${order._id}"><i data-lucide="calendar-clock"></i> Follow Up</button>
      </article>
    `).join('') || '<div class="empty-state">No requests found.</div>';
    lucide.createIcons();
    enhanceResponsiveTables();

    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', e => updateOrder(e.target.dataset.id, {
        status: e.target.value
      }));
    });

    document.querySelectorAll('.lead-status-select').forEach(select => {
      select.addEventListener('change', e => updateOrder(e.target.dataset.id, {
        leadStatus: e.target.value
      }));
    });

    document.querySelectorAll('.save-notes-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        const order = ordersData.find(item => item._id === id);
        updateOrder(id, {
          status: order?.status || 'New',
          notes: document.querySelector(`.notes-input[data-id="${id}"]`).value,
          followUpNotes: document.querySelector(`.follow-notes-input[data-id="${id}"]`).value
        });
      });
    });

    document.querySelectorAll('.mark-contacted-btn').forEach(btn => {
      btn.addEventListener('click', e => markOrderContacted(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.send-whatsapp-btn').forEach(btn => {
      btn.addEventListener('click', e => sendWhatsAppNotification(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.complete-request-btn').forEach(btn => {
      btn.addEventListener('click', e => updateOrder(e.currentTarget.dataset.id, {
        status: 'Completed'
      }));
    });

    document.querySelectorAll('.save-follow-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        scheduleOrderFollowUp(id, {
          nextFollowUpDate: document.querySelector(`.follow-date-input[data-id="${id}"]`).value,
          followUpNotes: document.querySelector(`.follow-notes-input[data-id="${id}"]`).value
        });
      });
    });
  };

  const sendWhatsAppNotification = async (id) => {
    try {
      const data = await api(`/api/orders/${id}/notifications/whatsapp`, {
        method: 'POST',
        headers: authHeaders()
      });
      window.open(data.data.whatsappUrl, '_blank', 'noopener');
      await fetchOrders();
      showToast('WhatsApp message prepared');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateOrder = async (id, payload) => {
    try {
      const data = await api(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const index = ordersData.findIndex(order => order._id === id);
      if (index !== -1) ordersData[index] = data.data;
      showToast('Request updated');
      await fetchOrders();
      fetchAnalytics();
    } catch (err) {
      showToast(err.message, 'error');
      fetchOrders();
    }
  };

  const markOrderContacted = async (id) => {
    try {
      const data = await api(`/api/orders/${id}/contacted`, {
        method: 'PATCH',
        headers: authHeaders()
      });
      const index = ordersData.findIndex(order => order._id === id);
      if (index !== -1) ordersData[index] = data.data;
      showToast('Request marked as contacted');
      await fetchOrders();
      fetchAnalytics();
    } catch (err) {
      showToast(err.message, 'error');
      fetchOrders();
    }
  };

  const scheduleOrderFollowUp = async (id, payload) => {
    if (!payload.nextFollowUpDate) {
      showToast('Select a follow-up date first', 'error');
      return;
    }

    try {
      const data = await api(`/api/orders/${id}/follow-up`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const index = ordersData.findIndex(order => order._id === id);
      if (index !== -1) ordersData[index] = data.data;
      showToast('Follow-up scheduled');
      renderOrders();
    } catch (err) {
      showToast(err.message, 'error');
      fetchOrders();
    }
  };

  ['search-phone', 'filter-type', 'filter-status'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderOrders);
    document.getElementById(id).addEventListener('change', renderOrders);
  });
  document.getElementById('refresh-btn').addEventListener('click', fetchOrders);

  const fetchSettings = async () => {
    try {
      const data = await api('/api/settings');
      Object.entries(data.data).forEach(([key, value]) => {
        const input = document.getElementById(`set-${key}`);
        if (input) input.value = value || '';
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const data = await api('/api/activity-logs', { headers: authHeaders() });
      activityLogsData = data.data || [];
      renderActivityLogs();
    } catch (err) {
      activityLogsData = [];
      renderActivityLogs();
    }
  };

  const renderActivityLogs = () => {
    const search = document.getElementById('activity-search')?.value.trim().toLowerCase() || '';
    const action = document.getElementById('activity-action-filter')?.value || '';
    const entity = document.getElementById('activity-entity-filter')?.value || '';
    const actions = [...new Set(activityLogsData.map(log => log.action).filter(Boolean))].sort();
    const entities = [...new Set(activityLogsData.map(log => log.entityType).filter(Boolean))].sort();
    const actionFilter = document.getElementById('activity-action-filter');
    const entityFilter = document.getElementById('activity-entity-filter');
    if (actionFilter && actionFilter.options.length <= 1) {
      actionFilter.innerHTML = '<option value="">All Actions</option>' + actions.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
    }
    if (entityFilter && entityFilter.options.length <= 1) {
      entityFilter.innerHTML = '<option value="">All Entities</option>' + entities.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
    }

    const filtered = activityLogsData.filter(log => {
      const text = `${log.action} ${log.entityType} ${log.adminEmail} ${log.details}`.toLowerCase();
      return (!search || text.includes(search)) && (!action || log.action === action) && (!entity || log.entityType === entity);
    });

    document.getElementById('activity-timeline').innerHTML = filtered.map(log => `
      <article class="activity-item">
        <div class="activity-dot"></div>
        <div>
          <span>${formatDateTime(log.createdAt)}</span>
          <h3>${escapeHtml(log.action)}</h3>
          <p>${escapeHtml(log.details || log.entityType)}</p>
          <small>${escapeHtml(log.adminEmail || 'system')} · ${escapeHtml(log.entityType || '-')}</small>
        </div>
      </article>
    `).join('') || '<div class="empty-state">No activity logs found.</div>';
  };

  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const keys = [
      'shopName',
      'phoneNumber',
      'whatsappNumber',
      'address',
      'heroTitle',
      'heroSubtitle',
      'offerBanner',
      'themeColor',
      'footerInformation',
      'metaTitle',
      'metaDescription',
      'keywords',
      'googleSiteVerification'
    ];
    const payload = keys.reduce((acc, key) => {
      acc[key] = document.getElementById(`set-${key}`).value.trim();
      return acc;
    }, {});

    try {
      await api('/api/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      showToast('Settings saved');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('company-logo-file').addEventListener('change', () => previewImage('company-logo-file', 'company-logo-preview'));
  document.getElementById('banner-image-file').addEventListener('change', () => previewImage('banner-image-file', 'banner-image-preview'));
  document.getElementById('prod-image-file').addEventListener('change', () => previewImage('prod-image-file', 'prod-image-preview'));

  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      await api('/api/admin/change-password', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword: document.getElementById('pwd-current').value,
          newPassword: document.getElementById('pwd-new').value,
          confirmPassword: document.getElementById('pwd-confirm').value
        })
      });
      showToast('Password changed successfully');
      document.getElementById('password-form').reset();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  const fetchAnalytics = async () => {
    try {
      const range = document.getElementById('analytics-range')?.value || 'all';
      const data = await api(`/api/analytics?range=${encodeURIComponent(range)}`, { headers: authHeaders() });
      renderAnalytics(data.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const renderAnalytics = (analytics) => {
    latestAnalytics = analytics;
    const cards = analytics.cards || {};
    const cardItems = [
      ['Total Companies', cards.totalCompanies, 'companies', 'building-2'],
      ['Total Products', cards.totalProducts, 'products', 'package'],
      ['Total Services', cards.totalServices, 'services', 'settings'],
      ['Total Requests', cards.totalRequests, 'requests', 'inbox'],
      ['Conversion Rate', `${cards.conversionRate || 0}%`, 'analytics', 'trending-up']
    ];

    const cardsHtml = cardItems.map(([label, value, tab, icon], index) => `
      <button type="button" class="stat-card stat-card-button kpi-card kpi-${index + 1}" data-tab-target="${escapeHtml(tab)}" aria-label="Open ${escapeHtml(tab)} section">
        <span class="kpi-icon"><i data-lucide="${icon}"></i></span>
        <span class="kpi-label">${escapeHtml(label)}</span>
        <strong data-count="${typeof value === 'string' ? escapeHtml(value) : Number(value) || 0}">${typeof value === 'string' ? escapeHtml(value) : Number(value) || 0}</strong>
        <span class="trend-pill positive"><i data-lucide="arrow-up-right"></i> Live</span>
      </button>
    `).join('');

    document.getElementById('dashboard-cards').innerHTML = cardsHtml;
    document.getElementById('analytics-content').innerHTML = `
      <div class="stats-grid">${cardsHtml}</div>
      <p style="color:var(--text-muted); margin:16px 0">Range: ${escapeHtml(analytics.range || 'all')}</p>
      <div class="chart-grid">
        <div class="chart-card"><h3>Requests By Status</h3><canvas id="chart-status"></canvas></div>
        <div class="chart-card"><h3>Requests By Type</h3><canvas id="chart-type"></canvas></div>
        <div class="chart-card"><h3>Most Requested Products</h3><canvas id="chart-products"></canvas></div>
        <div class="chart-card"><h3>Most Requested Services</h3><canvas id="chart-services"></canvas></div>
      </div>
    `;
    lucide.createIcons();
    drawBarChart('chart-status', analytics.requestsByStatus.map(item => ({ label: item._id || 'unknown', value: item.count })));
    drawBarChart('chart-type', analytics.requestsByType.map(item => ({ label: item._id || 'unknown', value: item.count })));
    drawBarChart('chart-products', analytics.mostRequestedItems.filter(item => item._id.type === 'product').map(item => ({ label: item._id.item, value: item.count })));
    drawBarChart('chart-services', analytics.mostRequestedItems.filter(item => item._id.type === 'repair' || item._id.type === 'service').map(item => ({ label: item._id.item, value: item.count })));
  };

  const drawBarChart = (canvasId, rows) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.max(320, rect.width - 32);
    canvas.height = 240;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Plus Jakarta Sans';

    if (!rows.length) {
      ctx.fillText('No data yet', 16, 40);
      return;
    }

    const max = Math.max(...rows.map(row => row.value), 1);
    const barHeight = 24;
    const gap = 16;
    rows.slice(0, 6).forEach((row, index) => {
      const y = 28 + index * (barHeight + gap);
      const width = Math.round((canvas.width - 150) * (row.value / max));
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(130, y, width, barHeight);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(row.label.slice(0, 18), 8, y + 16);
      ctx.fillText(String(row.value), 138 + width, y + 16);
    });
  };

  window.addEventListener('resize', () => {
    if (latestAnalytics) renderAnalytics(latestAnalytics);
  });

  document.getElementById('analytics-range').addEventListener('change', fetchAnalytics);
  document.getElementById('export-requests-csv').addEventListener('click', () => downloadExport('csv'));
  document.getElementById('export-requests-excel').addEventListener('click', () => downloadExport('excel'));
  ['activity-search', 'activity-action-filter', 'activity-entity-filter'].forEach(id => {
    const node = document.getElementById(id);
    if (!node) return;
    node.addEventListener('input', renderActivityLogs);
    node.addEventListener('change', renderActivityLogs);
  });

  document.body.addEventListener('click', (e) => {
    const card = e.target.closest('.stat-card-button[data-tab-target]');
    if (!card) return;
    activateAdminTab(card.dataset.tabTarget);
  });

  checkAuth();
});
