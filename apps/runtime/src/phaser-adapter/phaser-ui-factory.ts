/**
 * Phaser UI Factory
 * Isolates Phaser HUD object creation from runtime UI layer.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';

/** Renders above world content (entities/tilemaps use zIndex * 1000). */
export const RUNTIME_UI_DEPTH_BASE = 10_000;

type HUDGameObject = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Depth &
  Phaser.GameObjects.Components.ScrollFactor &
  Phaser.GameObjects.Components.Visible &
  Phaser.GameObjects.Components.Transform;

function asHUD(gameObject: Phaser.GameObjects.GameObject): HUDGameObject {
  return gameObject as HUDGameObject;
}

export interface UITextStyle {
  fontSize?: string;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}

export interface UIPanelStyle {
  fillColor?: number;
  fillAlpha?: number;
}

export function applyScreenSpace(gameObject: Phaser.GameObjects.GameObject, depth: number): void {
  const hud = asHUD(gameObject);
  hud.setScrollFactor(0);
  hud.setDepth(depth);
}

export function createUIText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  depth: number,
  style?: UITextStyle
): Phaser.GameObjects.Text {
  const obj = scene.add.text(x, y, text, {
    fontSize: style?.fontSize ?? '14px',
    fontFamily: style?.fontFamily ?? 'monospace',
    color: style?.color ?? '#ffffff',
    backgroundColor: style?.backgroundColor,
  });
  obj.setOrigin(0, 0);
  applyScreenSpace(obj, depth);
  return obj;
}

export function createUIPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  style?: UIPanelStyle
): Phaser.GameObjects.Rectangle {
  const obj = scene.add.rectangle(
    x,
    y,
    width,
    height,
    style?.fillColor ?? 0x000000,
    style?.fillAlpha ?? 0.55
  );
  obj.setOrigin(0, 0);
  applyScreenSpace(obj, depth);
  return obj;
}

export function setUIVisibility(gameObject: unknown, visible: boolean): void {
  const obj = gameObject as Phaser.GameObjects.GameObject;
  if (obj) asHUD(obj).setVisible(visible);
}

export function setUIPosition(gameObject: unknown, x: number, y: number): void {
  const obj = gameObject as Phaser.GameObjects.GameObject;
  if (!obj) return;
  if (typeof (obj as Phaser.GameObjects.Text).setPosition === 'function') {
    (obj as Phaser.GameObjects.Text).setPosition(x, y);
  }
}

export function setUITextContent(gameObject: unknown, text: string): void {
  const obj = gameObject as Phaser.GameObjects.Text;
  if (obj && typeof obj.setText === 'function') {
    obj.setText(text);
  }
}

export function destroyUIObject(gameObject: unknown): void {
  const obj = gameObject as Phaser.GameObjects.GameObject;
  if (!obj || typeof obj.destroy !== 'function') return;
  try {
    if (!(obj as { destroyed?: boolean }).destroyed) {
      obj.destroy();
    }
  } catch {
    // Isolated cleanup failure
  }
}
