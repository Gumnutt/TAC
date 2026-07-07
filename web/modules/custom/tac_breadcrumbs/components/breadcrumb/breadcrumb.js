/**
 * TAC Breadcrumb overflow behaviour.
 *
 * Progressive enhancement: without this script every crumb renders and the row
 * is allowed to wrap. Once upgraded, the row is kept on a single line and
 * middle parents are collapsed into an overflow (`…`) menu based on the width
 * of the parent container:
 *
 *   - Home (first) and the current page (last) are always visible.
 *   - Parents are collapsed from nearest-Home outward until the row fits.
 *   - If two or more labels are long (> max-label chars), all parents collapse.
 *   - Only the current page label is ever truncated (handled in CSS).
 */
(function () {
  'use strict';

  const MAX_LABEL_DEFAULT = 24;

  // Feature detection. The overflow menu is built on the Popover API; when it
  // is unavailable the element bails out and leaves the plain wrapping list.
  const SUPPORTS_POPOVER =
    typeof HTMLElement !== 'undefined' &&
    HTMLElement.prototype &&
    'popover' in HTMLElement.prototype;
  const SUPPORTS_ANCHOR =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('anchor-name: --a');

  // Guarantees a unique id/anchor-name per overflow menu on the page.
  let uid = 0;

  class TacBreadcrumb extends HTMLElement {
    connectedCallback() {
      this.list = this.querySelector(':scope > ol');
      if (!this.list) {
        return;
      }

      // Snapshot the original crumbs once so every render starts from a clean,
      // fully-expanded state.
      this.items = Array.from(this.list.querySelectorAll(':scope > li'));
      if (this.items.length === 0) {
        return;
      }

      // Without the Popover API leave the list fully expanded and wrapping.
      if (!SUPPORTS_POPOVER) {
        return;
      }

      this.maxLabel =
        parseInt(this.getAttribute('data-max-label'), 10) || MAX_LABEL_DEFAULT;
      this.overflowLi = null;

      this.setAttribute('data-enhanced', '');

      this.observer = new ResizeObserver(() => this.render());
      this.observer.observe(this);
      this.render();
    }

    disconnectedCallback() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }

    /** Visible text of a crumb, used for the "long label" test. */
    labelLength(li) {
      return (li.textContent || '').trim().length;
    }

    /** True when the single-line row is wider than the container. */
    isOverflowing() {
      return this.items.length > 3;
    }

    /** Restore all original crumbs in order and drop the overflow control. */
    reset() {
      if (this.overflowLi && this.overflowLi.parentNode) {
        this.overflowLi.remove();
        this.overflowLi = null;
      }
      this.items.forEach((li) => this.list.appendChild(li));
    }

    /**
     * Build the overflow control: a Popover API invoker button plus the
     * popover menu holding clones of the collapsed crumbs. The menu is anchored
     * to the button with CSS anchor positioning where supported, otherwise
     * positioned against the button's rect when it opens.
     */
    buildOverflow(collapsed) {
      const li = document.createElement('li');
      li.setAttribute('data-overflow', '');

      uid += 1;
      const id = 'tac-breadcrumb-overflow-' + uid;
      const anchorName = '--' + id;
      const count = collapsed.length;

      const button = document.createElement('button');
      button.type = 'button';
      // U+22EF midline horizontal ellipsis: vertically centred by design,
      // unlike U+2026 which sits on the baseline.
      button.textContent = '⋯';
      // wrap the text content in a span so the button can be sized to the text content and not the popover menu.
      const span = document.createElement('span');
      span.textContent = button.textContent;
      button.textContent = '';
      button.appendChild(span);
      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('popovertarget', id);
      button.setAttribute(
        'aria-label',
        'Show ' + count + ' hidden breadcrumb' + (count === 1 ? '' : 's'),
      );

      const menu = document.createElement('tac-overflow-menu');
      menu.id = id;
      menu.role = 'list';
      menu.setAttribute('popover', '');
      collapsed.forEach((source) => menu.appendChild(source.cloneNode(true)));

      if (SUPPORTS_ANCHOR) {
        button.style.anchorName = anchorName;
        menu.style.positionAnchor = anchorName;
      } else {
        menu.addEventListener('beforetoggle', (event) => {
          if (event.newState !== 'open') {
            return;
          }
          const rect = button.getBoundingClientRect();
          menu.style.position = 'fixed';
          menu.style.top = rect.bottom + 'px';
          menu.style.left = rect.left + 'px';
        });
      }

      li.appendChild(button);
      li.appendChild(menu);
      return li;
    }

    /**
     * Collapse the first `count` middle crumbs (those nearest Home) into the
     * overflow menu. `count` of 0 leaves the row fully expanded.
     */
    collapse(count) {
      this.reset();
      if (count <= 0) {
        return;
      }

      const collapsed = this.items.slice(1, count);
      this.overflowLi = this.buildOverflow(collapsed);
      // Insert the control immediately after Home.
      this.items[0].after(this.overflowLi);
      // Remove the collapsed originals from the visible row.
      collapsed.forEach((li) => li.remove());
    }

    render() {
      const n = this.items.length;
      // Home + current only (or fewer): nothing can be collapsed.
      if (n <= 2) {
        this.reset();
        return;
      }

      const middleCount = n - 2;
      const longLabels = this.items.filter(
        (li) => this.labelLength(li) > this.maxLabel,
      ).length;

      // Two or more long labels: collapse every parent, leaving Home + current.
      if (longLabels >= 2) {
        this.collapse(middleCount);
        return;
      }

      // Otherwise collapse parents one at a time until the row fits. The
      // current page is pinned to its capped width during this measurement so
      // parents are collapsed before the current label is allowed to truncate.
      this.setAttribute('data-measuring', '');
      let count = 0;
      this.collapse(count);
      while (this.isOverflowing() && count < middleCount) {
        count += 1;
        this.collapse(count);
      }
      this.removeAttribute('data-measuring');
    }
  }

  if ('customElements' in window && !customElements.get('tac-breadcrumb')) {
    customElements.define('tac-breadcrumb', TacBreadcrumb);
  }
})();
