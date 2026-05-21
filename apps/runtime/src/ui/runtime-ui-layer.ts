/**
 * Runtime UI Layer
 * Screen-space HUD API; Phaser details stay in phaser-ui-factory.
 * @module apps/runtime/ui
 */

import type Phaser from 'phaser';
import {
  createUIText,
  createUIPanel,
  destroyUIObject,
  setUIPosition,
  setUITextContent,
  setUIVisibility,
  type UITextStyle,
  type UIPanelStyle,
} from '../phaser-adapter/phaser-ui-factory.js';
import type { RuntimeUIElement, RuntimeUIPanel, RuntimeUIText } from './runtime-ui-element.js';

export type { RuntimeUIText, RuntimeUIPanel, RuntimeUIElement } from './runtime-ui-element.js';
export { isRuntimeUIText } from './runtime-ui-element.js';

export class RuntimeUILayer {
  private readonly elements = new Map<string, RuntimeUIElement>();
  private depthCounter = 0;
  private layerDisposed = false;

  constructor(
    private readonly phaserScene: Phaser.Scene,
    private readonly isSceneDisposed: () => boolean
  ) {}

  private canMutate(): boolean {
    return !this.layerDisposed && !this.isSceneDisposed();
  }

  private nextDepth(): number {
    return 10_000 + this.depthCounter++;
  }

  private getAlive(id: string): RuntimeUIElement | null {
    const el = this.elements.get(id);
    if (!el || el.destroyed) return null;
    return el;
  }

  /** @returns element or null if id taken, scene disposed, or creation failed */
  createText(
    id: string,
    x: number,
    y: number,
    text: string,
    style?: UITextStyle
  ): RuntimeUIText | null {
    if (!this.canMutate()) return null;
    if (this.elements.has(id)) {
      console.warn(`[RuntimeUI] Duplicate id '${id}'`);
      return null;
    }

    try {
      const gameObject = createUIText(this.phaserScene, x, y, text, this.nextDepth(), style);
      const element: RuntimeUIText = {
        id,
        type: 'text',
        visible: true,
        destroyed: false,
        gameObject,
        content: text,
      };
      this.elements.set(id, element);
      return element;
    } catch (err) {
      console.warn(`[RuntimeUI] createText '${id}' failed:`, err);
      return null;
    }
  }

  /** @returns element or null if id taken, scene disposed, or creation failed */
  createPanel(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    style?: UIPanelStyle
  ): RuntimeUIPanel | null {
    if (!this.canMutate()) return null;
    if (this.elements.has(id)) {
      console.warn(`[RuntimeUI] Duplicate id '${id}'`);
      return null;
    }
    if (width <= 0 || height <= 0) {
      console.warn(`[RuntimeUI] Invalid panel size for '${id}'`);
      return null;
    }

    try {
      const gameObject = createUIPanel(
        this.phaserScene,
        x,
        y,
        width,
        height,
        this.nextDepth(),
        style
      );
      const element: RuntimeUIPanel = {
        id,
        type: 'panel',
        visible: true,
        destroyed: false,
        gameObject,
        width,
        height,
      };
      this.elements.set(id, element);
      return element;
    } catch (err) {
      console.warn(`[RuntimeUI] createPanel '${id}' failed:`, err);
      return null;
    }
  }

  getElement(id: string): RuntimeUIElement | undefined {
    const el = this.getAlive(id);
    return el ?? undefined;
  }

  destroyElement(id: string): boolean {
    const el = this.elements.get(id);
    if (!el) return false;
    if (el.destroyed) return true;

    el.destroyed = true;
    el.visible = false;
    try {
      destroyUIObject(el.gameObject);
    } catch (err) {
      console.warn(`[RuntimeUI] destroyElement '${id}' failed:`, err);
    }
    this.elements.delete(id);
    return true;
  }

  setVisible(id: string, visible: boolean): boolean {
    if (!this.canMutate()) return false;
    const el = this.getAlive(id);
    if (!el) return false;

    el.visible = visible;
    try {
      setUIVisibility(el.gameObject, visible);
    } catch (err) {
      console.warn(`[RuntimeUI] setVisible '${id}' failed:`, err);
      return false;
    }
    return true;
  }

  setPosition(id: string, x: number, y: number): boolean {
    if (!this.canMutate()) return false;
    const el = this.getAlive(id);
    if (!el) return false;

    try {
      setUIPosition(el.gameObject, x, y);
    } catch (err) {
      console.warn(`[RuntimeUI] setPosition '${id}' failed:`, err);
      return false;
    }
    return true;
  }

  setText(id: string, text: string): boolean {
    if (!this.canMutate()) return false;
    const el = this.getAlive(id);
    if (!el || el.type !== 'text') return false;

    el.content = text;
    try {
      setUITextContent(el.gameObject, text);
    } catch (err) {
      console.warn(`[RuntimeUI] setText '${id}' failed:`, err);
      return false;
    }
    return true;
  }

  /** Destroy all UI elements; safe to call multiple times. */
  dispose(): void {
    if (this.layerDisposed) return;
    this.layerDisposed = true;

    for (const id of [...this.elements.keys()]) {
      this.destroyElement(id);
    }
    this.elements.clear();
  }
}
