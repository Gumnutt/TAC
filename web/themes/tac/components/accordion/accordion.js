import { ComponentType, ComponentInstance } from "../../lib/component.js";
import currentlyInCanvasEditor from "../../lib/currentlyInCanvasEditor.js";

class Accordion extends ComponentInstance {
  // An internal private property to keep up with the current state of the
  // accordion. The hash makes it so you can't get or set this property outside
  // of this file.
  #savedAsOpen;

  // Whether ancestor accordion containers should close other accordions when
  // this one is opened.
  shouldDispatchEvents = true;

  init() {
    if (currentlyInCanvasEditor()) {
      // In Canvas editor, show content by removing collapsed state classes
      const panel = this.el;
      panel.open = true;
      panel.removeAttribute("name");
      return;
    }

    this.contentContainer = this.el.querySelector("tac-accordion-content");
    this.focusableDescendants = this.contentContainer.querySelectorAll(
      ":is(input, select, textarea, button, object):not(:disabled), a:is([href]), [tabindex]",
    );

    this.focusableDescendants.forEach((el) => {
      el.tabIndex = el.tabIndex || 0;
      el.dataset.originalTabIndex = el.tabIndex;
    });

    this.isOpen = this.el.open || false;

    // Figure out what height the content will be when open so we can smoothly
    // animate to it with CSS.
    this.measureNaturalHeight();

    // Remeasure the height on every (debounced) resize event.
    let timeout = 0;

    window.addEventListener("resize", (e) => {
      this.el.classList.add("accordion--resizing");
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        this.measureNaturalHeight();
      }, 350);
    });
  }

  set isOpen(val) {
    if (val) {
      // First do all the DOM manipulation needed to actually open the
      // accordion.
      this.el.open = true;
      this.focusableDescendants.forEach((el) => {
        el.tabIndex = el.dataset.originalTabIndex;
      });
      this.el.setAttribute("aria-expanded", "true");

      // Then stash the current state in a simple private property with no
      // getters or setters involved.
      this.#savedAsOpen = true;

      // Dispatch an event that any accordion container ancestors can use to
      // close other accordions.
      if (this.shouldDispatchEvents) {
        this.el.dispatchEvent(new Event("accordionopen", { bubbles: true }));
      }
    } else {
      // DOM manipulation.
      this.focusableDescendants.forEach((el) => {
        el.tabIndex = -1;
      });
      this.el.setAttribute("aria-expanded", "false");
      // Stash current state.
      this.#savedAsOpen = false;
      this.el.open = false;
    }
  }

  // Get the simple boolean we saved in the setter.
  get isOpen() {
    return this.#savedAsOpen;
  }

  // Measure how tall the content should be when open so we can smoothly animate
  // to it using CSS.
  measureNaturalHeight() {
    // What we do here should not be seen by ancestor accordions.
    this.shouldDispatchEvents = false;
    // Remember what state the accordion started in.
    const previousState = this.isOpen;
    // Turn off animations.
    // Open the accordion if it's not already open.
    this.isOpen = true;
    // Measure the natural height and make it available to CSS as a custom
    // property.
    const height = this.contentContainer.getBoundingClientRect().height;
    this.el.style.setProperty("--natural-height", `${height}px`);
    // Restore the accordion to the state it started in.
    this.isOpen = previousState;
    // Become visible to ancestor accordions again.
    this.shouldDispatchEvents = true;
  }
}

new ComponentType(Accordion, "accordionPanel", "tac-accordion details");
