import currentlyInCanvasEditor from "../../lib/currentlyInCanvasEditor.js";
import { ComponentType, ComponentInstance } from "../../lib/component.js";

export default class Hero extends ComponentInstance {
  init() {
    if (currentlyInCanvasEditor()) {
      this.el.classList.add("in-canvas-editor");
    }
  }
}

new ComponentType(Hero, "hero", "tac-hero");