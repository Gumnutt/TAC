class TacNavbar extends HTMLElement {
  connectedCallback() {
    this.observer = new ResizeObserver(() => this.#updateHeight())
    this.observer.observe(this)
    this.#updateHeight()
    this.#navbarIsFloating()
  }

  disconnectedCallback() {
    this.observer?.disconnect()
  }

  #updateHeight() {
    document.documentElement.style.setProperty('--tac-navbar-height', `${this.offsetHeight}px`)
  }

  #navbarIsFloating() {
    const hero = document.getElementsByTagName('tac-hero')[0]
    hero && hero.hasAttribute('overlap-navbar') ? this.setAttribute('floating','') : null
  }
}

customElements.define('tac-navbar', TacNavbar)
