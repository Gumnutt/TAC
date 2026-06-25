import { ComponentType, ComponentInstance } from "../../lib/component.js";
import currentlyInCanvasEditor from "../../lib/currentlyInCanvasEditor.js";

class AccordionContainer extends ComponentInstance {
  init() {
    if (currentlyInCanvasEditor()) {
      return;
    }

    this.accordions = this.el.querySelectorAll("tac-accordion details");
    this.uuid = crypto.randomUUID()
    this.accordions.forEach((accordion) => {
      accordion.name = this.uuid;
    })
  }
}

new ComponentType(AccordionContainer, "accordionContainer", "tac-accordion");
