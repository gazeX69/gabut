import type { RuntimeScene } from '@vgz/engine-runtime'
import type { RuntimeMountedEntity } from './phaser-mounted-entity'

interface ScriptInstance {
  id: string;
  update?: (ctx: { entity: RuntimeMountedEntity, dt: number, console: any }) => void;
  interact?: (ctx: { entity: RuntimeMountedEntity, console: any }) => void;
}

export class RuntimeScriptSystem {
  private scripts = new Map<string, ScriptInstance>();

  constructor() {}

  /**
   * Initialize scripts from the scene data
   */
  public initFromScene(scene: RuntimeScene) {
    this.scripts.clear();
    const scripts = (scene as any).scripts || [];
    for (const scriptDef of scripts) {
      this.compileScript(scriptDef.id, scriptDef.source);
    }
  }

  /**
   * Safely compile a script and store it in the registry
   */
  public compileScript(id: string, source: string) {
    try {
      // Create a function that returns an object containing the exported functions
      // We wrap the user's code in a module-like closure
      const wrapper = `
        const exports = {};
        ${source.replace(/export function/g, 'exports.')}
        return exports;
      `;
      const factory = new Function(wrapper);
      const exports = factory();
      
      this.scripts.set(id, {
        id,
        update: typeof exports.update === 'function' ? exports.update : undefined,
        interact: typeof exports.interact === 'function' ? exports.interact : undefined
      });

      this.log('info', `Compiled script '${id}' successfully`);
    } catch (err: any) {
      this.scripts.set(id, { id }); // Register empty so we don't spam compile
      this.reportError('system', id, err.message, err.stack);
    }
  }

  public getScript(id: string): ScriptInstance | undefined {
    return this.scripts.get(id);
  }

  public tickEntity(entity: RuntimeMountedEntity, scriptId: string, dt: number) {
    const script = this.scripts.get(scriptId);
    if (!script || !script.update) return;

    try {
      script.update({
        entity,
        dt: dt / 1000, // dt in seconds usually better for scripts
        console: this.createVirtualConsole(entity.entityId, scriptId)
      });
    } catch (err: any) {
      this.reportError(entity.entityId, scriptId, err.message, err.stack);
    }
  }

  private createVirtualConsole(entityId: string, scriptId: string) {
    return {
      log: (...args: any[]) => this.log('info', args.join(' ')),
      warn: (...args: any[]) => this.log('warn', args.join(' ')),
      error: (...args: any[]) => this.log('error', args.join(' '))
    };
  }

  private log(level: 'info' | 'warn' | 'error', message: string) {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'RUNTIME_SCRIPT_LOG',
        payload: { level, message, timestamp: new Date().toLocaleTimeString() }
      }, '*');
    }
    console[level](message);
  }

  private reportError(entityId: string, scriptId: string, error: string, stack?: string) {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'RUNTIME_SCRIPT_ERROR',
        payload: { entityId, scriptId, error, stack }
      }, '*');
    }
    console.error(`[SCRIPT ERROR][${entityId}][${scriptId}] ${error}\n${stack || ''}`);
  }
}
