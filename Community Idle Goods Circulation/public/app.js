'use strict';
(function () {
  var STATUS_MAP = {
    on_sale: '在售',
    reserved: '已预订',
    sold: '已售出',
    pending: '待处理',
    accepted: '已接受',
    completed: '交易完成',
    rejected: '已拒绝'
  };

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    s = String(s);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPrice(p) {
    if (p === null || p === undefined || p === '') return '0';
    var n = Number(p);
    if (isNaN(n)) return escapeHtml(String(p));
    if (Math.floor(n) === n) return String(n);
    return n.toFixed(2);
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function formatTime(s) {
    if (!s) return '';
    var d = new Date(s);
    if (isNaN(d.getTime())) return escapeHtml(String(s));
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function statusText(s) { return STATUS_MAP[s] || escapeHtml(String(s)); }

  function debounce(fn, ms) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast ' + (kind || '');
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
      toastEl.className = 'toast';
    }, 2200);
  }

  var currentUid = Number(localStorage.getItem('uid')) || 0;
  var lastPublishedId = null;

  function api(path, opts) {
    opts = opts || {};
    var headers = opts.headers || {};
    headers['x-user-id'] = String(currentUid || 0);
    if (opts.json !== false && !(typeof FormData !== 'undefined' && opts.body instanceof FormData) && opts.body && typeof opts.body !== 'string') {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    opts.headers = headers;
    return fetch(path, opts).then(function (res) {
      if (res.ok) {
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('application/json') !== -1) return res.json();
        return res.text();
      }
      return res.json().catch(function () { return { error: '请求失败 (' + res.status + ')' }; })
        .then(function (data) {
          var msg = (data && data.error) ? data.error : '请求失败 (' + res.status + ')';
          throw new Error(msg);
        });
    });
  }

  var userSelect = $('#userSelect');

  function renderUsers(list) {
    userSelect.innerHTML = '';
    var anySelected = false;
    list.forEach(function (u) {
      var opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = (u.nickname || u.username) + ' (@' + u.username + ')';
      if (u.id === currentUid) { opt.selected = true; anySelected = true; }
      userSelect.appendChild(opt);
    });
    if (!anySelected && list.length > 0) {
      currentUid = list[0].id;
      localStorage.setItem('uid', currentUid);
      userSelect.value = currentUid;
    }
  }

  function loadUsers() {
    api('/api/users', { method: 'GET' }).then(function (list) {
      renderUsers(list);
    }).catch(function (err) {
      toast(err.message, 'err');
    });
  }

  function addUser() {
    var username = prompt('用户名（英文/数字）');
    if (!username) return;
    var nickname = prompt('昵称（展示名）');
    if (!nickname) nickname = username;
    api('/api/users', { method: 'POST', body: { username: username, nickname: nickname } })
      .then(function (u) {
        currentUid = u.id;
        localStorage.setItem('uid', currentUid);
        loadUsers();
        refreshActiveView();
        toast('欢迎，' + u.nickname, 'ok');
      }).catch(function (err) { toast(err.message, 'err'); });
  }

  function setView(view) {
    $all('.tab').forEach(function (t) {
      if (t.getAttribute('data-view') === view) t.classList.add('active');
      else t.classList.remove('active');
    });
    $all('.view').forEach(function (v) {
      if (v.id === 'view-' + view) v.classList.add('active');
      else v.classList.remove('active');
    });
    refreshActiveView();
  }

  function refreshActiveView() {
    var active = $('.tab.active');
    var view = active ? active.getAttribute('data-view') : 'list';
    if (view === 'list') loadGoods();
    else if (view === 'orders') loadOrders();
    else if (view === 'mine') loadMine();
  }

  function loadGoods() {
    var q = $('#search').value.trim();
    var status = $('#filterStatus').value;
    var params = [];
    if (q) params.push('q=' + encodeURIComponent(q));
    if (status) params.push('status=' + encodeURIComponent(status));
    var url = '/api/goods' + (params.length ? '?' + params.join('&') : '');
    api(url, { method: 'GET' }).then(function (list) {
      renderGoodsList(list, $('#goodsList'), $('#emptyList'));
    }).catch(function (err) { toast(err.message, 'err'); });
  }

  function renderGoodsList(list, container, emptyEl) {
    container.innerHTML = '';
    if (!list || list.length === 0) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    list.forEach(function (g) {
      var card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('data-id', g.id);
      if (g.id === lastPublishedId) {
        card.classList.add('newly');
        var newBadge = document.createElement('div');
        newBadge.className = 'badge new';
        newBadge.textContent = 'New';
        card.appendChild(newBadge);
      }
      var statusBadge = document.createElement('div');
      statusBadge.className = 'badge ' + (g.status || 'on_sale');
      statusBadge.textContent = statusText(g.status);
      card.appendChild(statusBadge);

      var cover = document.createElement('div');
      cover.className = 'cover';
      if (g.images && g.images.length > 0) {
        var img = document.createElement('img');
        img.src = g.images[0];
        img.alt = escapeHtml(g.title);
        cover.appendChild(img);
      } else {
        cover.textContent = '无图';
      }
      card.appendChild(cover);

      var body = document.createElement('div');
      body.className = 'body';

      var title = document.createElement('div');
      title.className = 'title';
      title.textContent = g.title;
      body.appendChild(title);

      var desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = g.description || '';
      body.appendChild(desc);

      var foot = document.createElement('div');
      foot.className = 'foot';
      var price = document.createElement('div');
      price.className = 'price';
      price.textContent = '¥' + formatPrice(g.price);
      foot.appendChild(price);
      var owner = document.createElement('div');
      owner.className = 'owner';
      owner.textContent = '卖家：' + (g.owner_name || '-');
      foot.appendChild(owner);
      body.appendChild(foot);

      card.appendChild(body);
      card.addEventListener('click', function () { openDetail(g.id); });
      container.appendChild(card);
    });
  }

  function loadMine() {
    api('/api/goods?user_id=' + currentUid, { method: 'GET' }).then(function (list) {
      $('#meTitle').textContent = '我的闲置 (' + (list ? list.length : 0) + ')';
      renderGoodsList(list, $('#mineList'), $('#emptyMine'));
    }).catch(function (err) { toast(err.message, 'err'); });
  }

  var publishModal = $('#publishModal');
  var previewContainer = $('#preview');
  var publishForm = $('#publishForm');
  var fileInput = $('#fileInput');
  var uploadedUrls = [];
  var editingId = null;

  function resetPublishModal() {
    publishForm.reset();
    publishForm.querySelectorAll('input[name="price"]').forEach(function (i) { i.value = '0'; });
    previewContainer.innerHTML = '';
    uploadedUrls = [];
    editingId = null;
    $('#publishTitle').textContent = '发布闲置';
    $('#submitBtn').textContent = '提交发布';
  }

  function openPublish() {
    resetPublishModal();
    publishModal.hidden = false;
  }

  function renderPreview() {
    previewContainer.innerHTML = '';
    uploadedUrls.forEach(function (url, idx) {
      var item = document.createElement('div');
      item.className = 'pitem';
      var img = document.createElement('img');
      img.src = url;
      item.appendChild(img);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '×';
      btn.addEventListener('click', function () {
        uploadedUrls.splice(idx, 1);
        renderPreview();
      });
      item.appendChild(btn);
      previewContainer.appendChild(item);
    });
  }

  function handleFiles() {
    var files = fileInput.files;
    if (!files || files.length === 0) return;
    if (uploadedUrls.length + files.length > 9) {
      toast('最多 9 张图片', 'err');
      fileInput.value = '';
      return;
    }
    var fd = new FormData();
    for (var i = 0; i < files.length; i++) fd.append('images', files[i]);
    api('/api/upload', { method: 'POST', body: fd, json: false })
      .then(function (res) {
        var urls = (res && res.urls) || [];
        uploadedUrls = uploadedUrls.concat(urls);
        renderPreview();
        fileInput.value = '';
      })
      .catch(function (err) { toast(err.message, 'err'); });
  }

  function submitPublish() {
    var title = publishForm.querySelector('[name="title"]').value.trim();
    if (!title) { toast('标题必填', 'err'); return; }
    var body = {
      title: title,
      description: publishForm.querySelector('[name="description"]').value.trim(),
      price: Number(publishForm.querySelector('[name="price"]').value) || 0,
      category: publishForm.querySelector('[name="category"]').value.trim(),
      location: publishForm.querySelector('[name="location"]').value.trim(),
      images: uploadedUrls.slice()
    };
    var promise;
    if (editingId) {
      promise = api('/api/goods/' + editingId, { method: 'PUT', body: body });
    } else {
      promise = api('/api/goods', { method: 'POST', body: body });
    }
    promise.then(function (g) {
      if (!editingId) {
        lastPublishedId = g.id;
        setTimeout(function () { if (lastPublishedId === g.id) lastPublishedId = null; }, 6000);
      }
      publishModal.hidden = true;
      window.scrollTo(0, 0);
      refreshActiveView();
      toast(editingId ? '已更新' : '发布成功', 'ok');
    }).catch(function (err) { toast(err.message, 'err'); });
  }

  var detailModal = $('#detailModal');
  var detailGoods = null;

  function openDetail(id) {
    api('/api/goods/' + id, { method: 'GET' }).then(function (g) {
      detailGoods = g;
      renderDetail();
      detailModal.hidden = false;
    }).catch(function (err) { toast(err.message, 'err'); });
  }

  function renderDetail() {
    var g = detailGoods;
    $('#detailTitle').textContent = g.title || '商品详情';

    var gallery = $('#detailGallery');
    gallery.innerHTML = '';
    if (g.images && g.images.length > 0) {
      g.images.forEach(function (url) {
        var img = document.createElement('img');
        img.src = url;
        img.alt = escapeHtml(g.title);
        gallery.appendChild(img);
      });
    } else {
      var ph = document.createElement('div');
      ph.className = 'ph';
      ph.textContent = '无图';
      gallery.appendChild(ph);
    }

    var meta = $('#detailMeta');
    var isOwner = Number(g.user_id) === currentUid;
    meta.innerHTML = '';
    meta.insertAdjacentHTML('beforeend',
      '<div class="price-big">¥' + escapeHtml(formatPrice(g.price)) + '</div>' +
      '<div class="kv">状态：<span class="badge ' + escapeHtml(g.status || 'on_sale') + '" style="position:static;display:inline-block;">' + escapeHtml(statusText(g.status)) + '</span></div>' +
      '<div class="kv">卖家：' + escapeHtml(g.owner_name || g.owner_username || '') + ' (@' + escapeHtml(g.owner_username || '') + ')</div>' +
      '<div class="kv">分类：' + escapeHtml(g.category || '-') + '　·　位置：' + escapeHtml(g.location || '-') + '</div>' +
      '<div class="kv">发布时间：' + escapeHtml(formatTime(g.created_at)) + '</div>' +
      (g.description ? '<div class="desc-box">' + escapeHtml(g.description) + '</div>' : '')
    );

    var actions = $('#detailActions');
    actions.innerHTML = '';
    if (isOwner) {
      if (g.status !== 'on_sale') {
        var b1 = document.createElement('button');
        b1.className = 'btn ghost small';
        b1.textContent = '标记为在售';
        b1.addEventListener('click', function () { updateStatus(g.id, 'on_sale'); });
        actions.appendChild(b1);
      }
      if (g.status !== 'reserved') {
        var b2 = document.createElement('button');
        b2.className = 'btn warn small';
        b2.textContent = '标记为已预订';
        b2.addEventListener('click', function () { updateStatus(g.id, 'reserved'); });
        actions.appendChild(b2);
      }
      var b3 = document.createElement('button');
      b3.className = 'btn ghost small';
      b3.textContent = '编辑';
      b3.addEventListener('click', function () { editGoods(g); });
      actions.appendChild(b3);

      var b4 = document.createElement('button');
      b4.className = 'btn danger small';
      b4.textContent = '删除';
      b4.addEventListener('click', function () { deleteGoods(g.id); });
      actions.appendChild(b4);
    }

    var buyRow = $('#buyRow');
    if (!isOwner && g.status === 'on_sale') {
      buyRow.hidden = false;
      $('#buyMsg').value = '';
    } else {
      buyRow.hidden = true;
    }

    loadComments(g.id);
  }

  function updateStatus(id, status) {
    api('/api/goods/' + id, { method: 'PUT', body: { status: status } })
      .then(function () {
        toast('状态已更新', 'ok');
        openDetail(id);
        refreshActiveView();
      }).catch(function (err) { toast(err.message, 'err'); });
  }

  function deleteGoods(id) {
    if (!confirm('确定删除该商品？')) return;
    api('/api/goods/' + id, { method: 'DELETE' })
      .then(function () {
        detailModal.hidden = true;
        refreshActiveView();
        toast('已删除', 'ok');
      }).catch(function (err) { toast(err.message, 'err'); });
  }

  function editGoods(g) {
    resetPublishModal();
    editingId = g.id;
    $('#publishTitle').textContent = '编辑闲置';
    $('#submitBtn').textContent = '保存修改';
    publishForm.querySelector('[name="title"]').value = g.title || '';
    publishForm.querySelector('[name="description"]').value = g.description || '';
    publishForm.querySelector('[name="price"]').value = g.price || 0;
    publishForm.querySelector('[name="category"]').value = g.category || '';
    publishForm.querySelector('[name="location"]').value = g.location || '';
    uploadedUrls = (g.images || []).slice();
    renderPreview();
    detailModal.hidden = true;
    publishModal.hidden = false;
  }

  function handleBuy() {
    var g = detailGoods;
    if (!g) return;
    var msg = $('#buyMsg').value.trim();
    api('/api/orders', { method: 'POST', body: { goods_id: g.id, message: msg } })
      .then(function () {
        toast('购买请求已发送', 'ok');
        detailModal.hidden = true;
      }).catch(function (err) { toast(err.message, 'err'); });
  }

  var commentList = $('#commentList');
  function loadComments(goodsId) {
    api('/api/goods/' + goodsId + '/messages', { method: 'GET' })
      .then(function (list) {
        commentList.innerHTML = '';
        if (!list || list.length === 0) {
          commentList.innerHTML = '<div style="color:#9ca3af;font-size:12.5px;">还没有留言，来抢沙发吧~</div>';
          return;
        }
        list.forEach(function (c) { appendComment(c); });
      }).catch(function (err) { toast(err.message, 'err'); });
  }

  function appendComment(c) {
    var bubble = document.createElement('div');
    bubble.className = 'comment-bubble';
    bubble.setAttribute('data-id', c.id);
    var who = document.createElement('div');
    who.className = 'who';
    who.textContent = (c.user_nickname || c.user_name || c.user_username || '用户') + ' · ' + formatTime(c.created_at);
    if (Number(c.user_id) === currentUid) {
      var del = document.createElement('span');
      del.className = 'del';
      del.textContent = '删除';
      del.addEventListener('click', function () {
        api('/api/messages/' + c.id, { method: 'DELETE' })
          .then(function () {
            bubble.remove();
            toast('已删除', 'ok');
          }).catch(function (err) { toast(err.message, 'err'); });
      });
      who.appendChild(del);
    }
    bubble.appendChild(who);
    var content = document.createElement('div');
    content.className = 'content';
    content.textContent = c.content || '';
    bubble.appendChild(content);
    commentList.appendChild(bubble);
  }

  function sendComment(e) {
    e.preventDefault();
    var input = $('#commentInput');
    var text = input.value;
    if (!text || !text.trim()) return;
    var g = detailGoods;
    if (!g) return;
    api('/api/goods/' + g.id + '/messages', { method: 'POST', body: { content: text.trim() } })
      .then(function (c) {
        input.value = '';
        appendComment(c);
      }).catch(function (err) { toast(err.message, 'err'); });
  }

  var orderRole = 'buyer';
  function setOrderRole(role) {
    orderRole = role;
    $all('.chip').forEach(function (c) {
      if (c.getAttribute('data-role') === role) c.classList.add('active');
      else c.classList.remove('active');
    });
    loadOrders();
  }

  function loadOrders() {
    api('/api/orders?role=' + orderRole, { method: 'GET' })
      .then(function (list) { renderOrders(list); })
      .catch(function (err) { toast(err.message, 'err'); });
  }

  function renderOrders(list) {
    var container = $('#ordersList');
    var emptyEl = $('#emptyOrders');
    container.innerHTML = '';
    if (!list || list.length === 0) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    list.forEach(function (o) { appendOrder(o); });
  }

  function appendOrder(o) {
    var container = $('#ordersList');
    var card = document.createElement('div');
    card.className = 'order-card';
    card.setAttribute('data-id', o.id);
    var done = (o.status === 'completed' || o.status === 'rejected');
    if (done) card.classList.add('done');

    var thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (o.goods_images && o.goods_images.length > 0) {
      var img = document.createElement('img');
      img.src = o.goods_images[0];
      img.alt = escapeHtml(o.goods_title);
      thumb.appendChild(img);
    } else {
      thumb.textContent = '无图';
    }
    card.appendChild(thumb);

    var info = document.createElement('div');
    info.className = 'info';
    var titleRow = document.createElement('div');
    titleRow.className = 'title';
    titleRow.textContent = o.goods_title || '';
    info.appendChild(titleRow);

    var priceRow = document.createElement('div');
    priceRow.className = 'sub';
    priceRow.innerHTML = '<span style="color:#dc2626;font-weight:600;">¥' + escapeHtml(formatPrice(o.goods_price)) + '</span>　' +
      (orderRole === 'seller' ? '买家：' : '卖家：') +
      escapeHtml(orderRole === 'seller' ? (o.buyer_name || '') : (o.seller_name || ''));
    info.appendChild(priceRow);

    var statusRow = document.createElement('div');
    statusRow.className = 'sub';
    statusRow.innerHTML = '<span class="order-status ' + escapeHtml(o.status) + '">' + escapeHtml(statusText(o.status)) + '</span>' +
      '　' + escapeHtml(formatTime(o.created_at));
    info.appendChild(statusRow);

    if (o.message) {
      var msgRow = document.createElement('div');
      msgRow.className = 'sub';
      msgRow.textContent = '留言：' + o.message;
      info.appendChild(msgRow);
    }
    card.appendChild(info);

    var actions = document.createElement('div');
    actions.className = 'actions';
    if (orderRole === 'seller') {
      if (o.status === 'pending') {
        var a1 = document.createElement('button');
        a1.className = 'btn primary small';
        a1.textContent = '接受';
        a1.addEventListener('click', function () { updateOrder(o.id, 'accepted'); });
        actions.appendChild(a1);
        var a2 = document.createElement('button');
        a2.className = 'btn danger small';
        a2.textContent = '拒绝';
        a2.addEventListener('click', function () { updateOrder(o.id, 'rejected'); });
        actions.appendChild(a2);
      } else if (o.status === 'accepted') {
        var a3 = document.createElement('button');
        a3.className = 'btn primary small';
        a3.textContent = '确认售出';
        a3.addEventListener('click', function () { updateOrder(o.id, 'completed'); });
        actions.appendChild(a3);
      }
    } else {
      if (o.status === 'pending') {
        var a4 = document.createElement('button');
        a4.className = 'btn danger small';
        a4.textContent = '取消订单';
        a4.addEventListener('click', function () {
          if (!confirm('确定取消该订单？')) return;
          api('/api/orders/' + o.id, { method: 'DELETE' })
            .then(function () { toast('已取消', 'ok'); loadOrders(); })
            .catch(function (err) { toast(err.message, 'err'); });
        });
        actions.appendChild(a4);
      }
    }
    card.appendChild(actions);
    container.appendChild(card);
  }

  function updateOrder(id, status) {
    api('/api/orders/' + id, { method: 'PUT', body: { status: status } })
      .then(function () {
        if (status === 'completed') toast('✔ 交易完成！', 'ok');
        else if (status === 'rejected') toast('已拒绝', 'ok');
        else toast('状态已更新', 'ok');
        loadOrders();
      }).catch(function (err) { toast(err.message, 'err'); });
  }

  function bindEvents() {
    userSelect.addEventListener('change', function () {
      currentUid = Number(userSelect.value) || 0;
      localStorage.setItem('uid', currentUid);
      refreshActiveView();
    });
    $('#addUserBtn').addEventListener('click', addUser);

    $all('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        setView(t.getAttribute('data-view'));
      });
    });

    $('#search').addEventListener('input', debounce(function () { loadGoods(); }, 250));
    $('#filterStatus').addEventListener('change', loadGoods);
    $('#openPublishBtn').addEventListener('click', openPublish);
    $('#refreshMineBtn').addEventListener('click', loadMine);

    fileInput.addEventListener('change', handleFiles);
    $('#submitBtn').addEventListener('click', function (e) { e.preventDefault(); submitPublish(); });

    $all('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.modal').hidden = true;
      });
    });

    $('#buyBtn').addEventListener('click', handleBuy);
    $('#commentForm').addEventListener('submit', sendComment);
    $('#commentInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendComment(e);
      }
    });

    $all('#view-orders .chip').forEach(function (c) {
      c.addEventListener('click', function () { setOrderRole(c.getAttribute('data-role')); });
    });
  }

  bindEvents();
  loadUsers();
  setView('list');
})();
