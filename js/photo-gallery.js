/**
 * REVIEW POOL GALLERY - FSPORT CLUB
 * Grid 8 cột siêu sát, lightbox hiển thị tên + review
 */

(function() {
    'use strict';

    const CONFIG = {
        containerId: 'photo-gallery-container',
        jsonUrl: '/json/photo-gallery.json',
        reviews: [],
        currentReview: null
    };

    // Tạo cấu trúc HTML (đã xóa SEE ALL, swipe, badge)
    function createStructure() {
        return `
            <div class="photo-gallery-wrapper">
                <div class="gallery-header-fsport">
                    <div class="brand-fsport">CUSTOMER REVIEW &amp; CLUB</div>
                </div>
                <div class="review-grid" id="reviewGrid"></div>
            </div>
            <div id="lightboxFsport" class="lightbox-fsport">
                <div class="lightbox-content">
                    <img class="lightbox-img" id="lightboxImg" alt="">
                    <div class="lightbox-details">
                        <div class="lightbox-name" id="lightboxName"></div>
                        <div class="lightbox-review" id="lightboxReview"></div>
                    </div>
                    <div class="close-lightbox" id="closeLightboxBtn">✕</div>
                </div>
            </div>
        `;
    }

    // Render grid: chỉ có ảnh, không text
    function renderGrid() {
        const grid = document.getElementById('reviewGrid');
        if (!grid || !CONFIG.reviews.length) return;
        grid.innerHTML = '';
        CONFIG.reviews.forEach(review => {
            const item = document.createElement('div');
            item.className = 'review-item';
            item.setAttribute('data-id', review.id);
            const img = document.createElement('img');
            img.className = 'review-img';
            img.src = review.image;
            img.alt = review.name;
            img.loading = 'lazy';
            item.appendChild(img);
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                openLightbox(review);
            });
            grid.appendChild(item);
        });
    }

    // Lightbox hiển thị ảnh lớn + tên + review
    function openLightbox(review) {
        if (typeof window.fsport !== 'undefined') {
            window.fsport.track('club_post_view', { post_id: review.id, post_title: review.name })
        }
        CONFIG.currentReview = review;
        const lightbox = document.getElementById('lightboxFsport');
        const img = document.getElementById('lightboxImg');
        const nameEl = document.getElementById('lightboxName');
        const reviewEl = document.getElementById('lightboxReview');
        if (img) img.src = review.image;
        if (nameEl) nameEl.innerHTML = `<strong>Tên:</strong> ${escapeHtml(review.name)}`;
        if (reviewEl) reviewEl.innerHTML = `<strong>Review:</strong> ${escapeHtml(review.review)}`;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        const lightbox = document.getElementById('lightboxFsport');
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Helper escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Bind events
    function bindEvents() {
        const closeBtn = document.getElementById('closeLightboxBtn');
        if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
        const lightbox = document.getElementById('lightboxFsport');
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) closeLightbox();
            });
        }
        window.addEventListener('keydown', (e) => {
            if (!document.getElementById('lightboxFsport').classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
        });
    }

    // Fetch JSON
    function loadData() {
        fetch(CONFIG.jsonUrl)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data && data.reviews && Array.isArray(data.reviews)) {
                    CONFIG.reviews = data.reviews;
                    renderGrid();
                    bindEvents();
                } else {
                    throw new Error('JSON thiếu key "reviews"');
                }
            })
            .catch(err => {
                console.error(err);
                const grid = document.getElementById('reviewGrid');
                if (grid) grid.innerHTML = '<div style="color:red; text-align:center; padding:20px;">❌ Lỗi tải dữ liệu review</div>';
            });
    }

    // Khởi tạo
    function init() {
        const container = document.getElementById(CONFIG.containerId);
        if (!container) {
            console.error(`Không tìm thấy #${CONFIG.containerId}`);
            return;
        }
        container.innerHTML = createStructure();
        loadData();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
