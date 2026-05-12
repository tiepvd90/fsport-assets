// js/utils/branding.js - Centralized branding utilities for consistent logo/brand display

import CONFIG from "../config.js";

class BrandingUtils {
  /**
   * Render logo HTML with image and text
   * @returns {string} HTML string for logo
   */
  static getLogoHTML() {
    const { image, alt, fallback } = CONFIG.branding.logo;
    const text = CONFIG.branding.text;

    return `
      <img
        src="${image}"
        alt="${alt}"
        class="logo-img"
        onerror="this.src='${fallback}'"
      />
      <span class="logo-text">${this.escapeHtml(text)}</span>
    `;
  }

  /**
   * Render complete logo link (used in header)
   * @param {string} href - Link destination (default: dashboard)
   * @returns {string} HTML string for logo link
   */
  static getLogoBrandingHTML(href = CONFIG.paths.dashboard) {
    const logoHTML = this.getLogoHTML();
    return `
      <a href="${href}" class="logo" title="${CONFIG.branding.company}">
        ${logoHTML}
      </a>
    `;
  }

  /**
   * Render footer contact information
   * @returns {string} HTML string for footer contact section
   */
  static getFooterContactHTML() {
    const { phone } = CONFIG.contact;
    return `<p class="footer-contact">Liên Hệ: SĐT/ZALO ${phone}</p>`;
  }

  /**
   * Render footer links section
   * @returns {string} HTML string for footer links
   */
  static getFooterLinksHTML() {
    const { websiteUrl, website, facebookUrl, facebook } = CONFIG.contact;
    return `
      <div class="footer-links">
        <p>Website: <a href="${websiteUrl}" target="_blank">${website}</a></p>
        <p>Facebook: <a href="${facebookUrl}" target="_blank">${facebook}</a></p>
      </div>
    `;
  }

  /**
   * Render complete footer content
   * @returns {string} HTML string for entire footer
   */
  static getFooterHTML() {
    const contact = this.getFooterContactHTML();
    const links = this.getFooterLinksHTML();
    const copyright = CONFIG.footer.copyright;

    return `
      <div class="footer-content">
        ${contact}
        ${links}
        <p>${this.escapeHtml(copyright)}</p>
      </div>
    `;
  }

  /**
   * Inject logo into existing header element
   * @param {string|HTMLElement} selector - CSS selector or element
   * @param {string} href - Link destination (optional)
   */
  static injectLogo(selector, href = CONFIG.paths.dashboard) {
    const element = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!element) {
      console.warn("[BrandingUtils] Logo element not found:", selector);
      return;
    }

    element.innerHTML = this.getLogoBrandingHTML(href);
  }

  /**
   * Inject footer into existing footer element
   * @param {string|HTMLElement} selector - CSS selector or element
   */
  static injectFooter(selector) {
    const element = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!element) {
      console.warn("[BrandingUtils] Footer element not found:", selector);
      return;
    }

    element.innerHTML = this.getFooterHTML();
  }

  /**
   * Update logo on current page
   * Useful when page context changes (e.g., not on dashboard from login page)
   * @param {string} currentPage - Current page name
   */
  static updateLogoLink(currentPage) {
    const logoLink = document.querySelector(".logo");
    if (!logoLink) return;

    // Adjust href based on current page
    const targetPage = currentPage === "login" || currentPage === "register" ? CONFIG.paths.dashboard : CONFIG.paths.dashboard;
    logoLink.href = targetPage;
  }

  /**
   * Get company name
   * @returns {string} Company name
   */
  static getCompanyName() {
    return CONFIG.branding.company;
  }

  /**
   * Get logo image URL
   * @returns {string} Logo image URL
   */
  static getLogoImageUrl() {
    return CONFIG.branding.logo.image;
  }

  /**
   * Get branding text
   * @returns {string} Branding text
   */
  static getBrandingText() {
    return CONFIG.branding.text;
  }

  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get contact information object
   * @returns {object} Contact info
   */
  static getContactInfo() {
    return CONFIG.contact;
  }
}

export default BrandingUtils;
