/**
 * F-SPORT PHOTO GALLERY
 * Admin data is preferred; the legacy JSON remains a safe fallback.
 */
(function() {
    'use strict';

    const lazyImages = window.FSPORT_LAZY_IMAGES || (window.FSPORT_LAZY_IMAGES = (function() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
        const slow = connection.saveData || /(^|-)2g$|3g/.test(connection.effectiveType || '');
        const maxConcurrent = slow ? 2 : 4;
        let active = 0;
        const queue = [];
        function pump() {
            while (active < maxConcurrent && queue.length) {
                const image = queue.shift();
                if (!image || image.dataset.lazyStarted === '1') continue;
                image.dataset.lazyStarted = '1';
                active++;
                const done = function() {
                    active = Math.max(0, active - 1);
                    image.removeEventListener('load', done);
                    image.removeEventListener('error', done);
                    pump();
                };
                image.addEventListener('load', done);
                image.addEventListener('error', done);
                image.src = image.dataset.src || '';
                image.removeAttribute('data-src');
            }
        }
        const observer = 'IntersectionObserver' in window ? new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                queue.push(entry.target);
            });
            pump();
        }, { rootMargin: slow ? '120px 0px' : '400px 0px', threshold: 0.01 }) : null;
        return {
            observe: function(image, src) {
                if (!src) return;
                image.loading = 'lazy';
                image.decoding = 'async';
                image.fetchPriority = 'low';
                image.dataset.src = src || '';
                if (observer) observer.observe(image);
                else { queue.push(image); pump(); }
            }
        };
    })());

    const CONFIG = {
        containerId: 'photo-gallery-container',
        jsonUrl: '/json/photo-gallery.json',
        apiUrl: 'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/photo-gallery-config?slug=customer-review-club',
        title: 'CUSTOMER REVIEW & CLUB',
        reviews: [],
        currentReview: null,
        eventsBound: false
    };

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function(char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
        });
    }

    function createStructure() {
        return `
            <div class="photo-gallery-wrapper">
                <div class="gallery-header-fsport">
                    <div class="brand-fsport">${escapeHtml(CONFIG.title)}</div>
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
                    <button type="button" class="close-lightbox" id="closeLightboxBtn" aria-label="Đóng">✕</button>
                </div>
            </div>`;
    }

    function renderGrid() {
        const grid = document.getElementById('reviewGrid');
        if (!grid) return;
        grid.innerHTML = '';
        CONFIG.reviews.forEach(function(review) {
            const item = document.createElement('div');
            item.className = 'review-item';
            item.dataset.id = review.id;

            const image = document.createElement('img');
            image.className = 'review-img';
            image.alt = review.alt || review.name || CONFIG.title;
            lazyImages.observe(image, review.image);
            item.appendChild(image);
            item.addEventListener('click', function(event) {
                event.stopPropagation();
                openLightbox(review);
            });
            grid.appendChild(item);
        });
    }

    function openLightbox(review) {
        if (window.fsport && typeof window.fsport.track === 'function') {
            window.fsport.track('club_post_view', { post_id: review.id, post_title: review.name });
        }
        CONFIG.currentReview = review;
        const lightbox = document.getElementById('lightboxFsport');
        const image = document.getElementById('lightboxImg');
        const name = document.getElementById('lightboxName');
        const text = document.getElementById('lightboxReview');
        if (!lightbox) return;
        if (image) {
            image.src = review.image;
            image.alt = review.alt || review.name || CONFIG.title;
        }
        if (name) name.innerHTML = '<strong>Tên:</strong> ' + escapeHtml(review.name);
        if (text) text.innerHTML = '<strong>Review:</strong> ' + escapeHtml(review.review);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        const lightbox = document.getElementById('lightboxFsport');
        if (lightbox) lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function bindEvents() {
        if (CONFIG.eventsBound) return;
        CONFIG.eventsBound = true;
        const close = document.getElementById('closeLightboxBtn');
        const lightbox = document.getElementById('lightboxFsport');
        if (close) close.addEventListener('click', closeLightbox);
        if (lightbox) lightbox.addEventListener('click', function(event) {
            if (event.target === lightbox) closeLightbox();
        });
        window.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') closeLightbox();
        });
    }

    function applyData(data) {
        if (!data || !Array.isArray(data.reviews)) throw new Error('Dữ liệu gallery không hợp lệ');
        CONFIG.title = data.title || CONFIG.title;
        CONFIG.reviews = data.reviews;
        const title = document.querySelector('#' + CONFIG.containerId + ' .brand-fsport');
        if (title) title.textContent = CONFIG.title;
        renderGrid();
        bindEvents();
    }

    function fillMissingReviewDetails(data) {
        if (!data || !Array.isArray(data.reviews)) return Promise.resolve(data);
        const hasMissingDetails = data.reviews.some(function(review) {
            return !String(review.name || '').trim() || !String(review.review || '').trim();
        });
        if (!hasMissingDetails) return Promise.resolve(data);
        return fetch(CONFIG.jsonUrl).then(function(response) {
            if (!response.ok) throw new Error('Static gallery HTTP ' + response.status);
            return response.json();
        }).then(function(fallbackData) {
            const fallbackReviews = Array.isArray(fallbackData.reviews) ? fallbackData.reviews : [];
            const byImage = {};
            fallbackReviews.forEach(function(review) {
                if (review.image) byImage[String(review.image)] = review;
            });
            data.reviews = data.reviews.map(function(review, index) {
                const fallback = byImage[String(review.image || '')] || fallbackReviews[index] || {};
                return Object.assign({}, review, {
                    name: String(review.name || '').trim() || fallback.name || '',
                    review: String(review.review || '').trim() || fallback.review || ''
                });
            });
            return data;
        }).catch(function(error) {
            console.warn('[PhotoGallery] Cannot fill missing review details.', error);
            return data;
        });
    }

    function loadStaticFallback() {
        return fetch(CONFIG.jsonUrl).then(function(response) {
            if (!response.ok) throw new Error('Static gallery HTTP ' + response.status);
            return response.json();
        }).then(applyData);
    }

    function loadLegacyData() {
        return fetch(CONFIG.apiUrl, { headers: { Accept: 'application/json' } })
            .then(function(response) {
                if (!response.ok) throw new Error('Gallery API HTTP ' + response.status);
                return response.json();
            })
            .then(fillMissingReviewDetails)
            .then(applyData)
            .catch(function(error) {
                console.warn('[PhotoGallery] Backend unavailable, using static JSON.', error);
                return loadStaticFallback();
            })
            .catch(function(error) {
                console.error('[PhotoGallery] Cannot load gallery.', error);
                const grid = document.getElementById('reviewGrid');
                if (grid) grid.innerHTML = '<div style="color:red;text-align:center;padding:20px">Không thể tải thư viện ảnh</div>';
            });
    }

    async function init() {
        const container = document.getElementById(CONFIG.containerId);
        if (!container) return;
        const frontendConfig = await (window.FSPORT_FRONTEND_PAGE_CONFIG_PROMISE || Promise.resolve(null)).catch(function() { return null; });
        if (frontendConfig) {
            const enabled = !frontendConfig.settings || !frontendConfig.settings.photoGallery || frontendConfig.settings.photoGallery.enabled !== false;
            if (!enabled) {
                container.innerHTML = '';
                return;
            }
            container.innerHTML = createStructure();
            if (frontendConfig.gallery) applyData(await fillMissingReviewDetails(frontendConfig.gallery));
            return;
        }
        const runtimeConfig = await (window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE || Promise.resolve(null)).catch(function() { return null; });
        const page = window.FSPORT_PRODUCT_PAGE;
        const section = page && page.getSection ? page.getSection('photo_gallery') : null;
        if (runtimeConfig && (!section || section.active === false)) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = createStructure();
        if (runtimeConfig) {
            if (section.content) {
                applyData(await fillMissingReviewDetails(section.content));
            } else {
                const grid = document.getElementById('reviewGrid');
                if (grid) grid.innerHTML = '';
            }
            return;
        }
        loadLegacyData();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
