
'use strict'

import { BasePlugin, Span } from '@pm2/opencensus-core'
import * as shimmer from 'shimmer'
import * as nuxt from 'nuxt'

/** nuxt instrumentation plugin for Opencensus */
export class NuxtPlugin extends BasePlugin {

  /** Name of the span */
  private readonly SPAN_QUERY_TYPE = 'NUXT-SERVER'

  /** Constructs a new instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches functions.
   */
  protected applyPatch () {
    this.logger.debug('Patched nuxt')

    // here the moduleExports is the same as require('nuxt') object
    if (this.moduleExports) {
      /**
       * We can hook into Nuxt and Vuejs
       * You have two concept:
       *  - Trace (or Rootspan)
       *    it represent the whole request and what happen inside it
       *  - Span
       *    it represent an operation inside a request
       *
       * The rootSpan should be already created by the http server when it receive a request
       * so we only need to add the 'Span' that represent the rendering of component
       *
       * To be sure that we already have a root span, you can use:
       * if (plugin.tracer.currentRootSpan) {}
       * where plugin = the NuxtPlugin's instance that you can access with 'this'
       *
       * when a operation start (like rendering a component), you can use
       *
       * const span = plugin.tracer.startChildSpan(operationName, plugin.SPAN_QUERY_TYPE)
       *
       * note: the span can be null
       * you can add more information about the span with the `span.addAttribute` method
       *
       * Then when the operation is finished, you must manually end the span with:
       * span.end()
       *
       * When the request is done, you should see in the console your spans with the metadata
       * verify that the duration match the actual rendering (so we are sure the span.end() are actually called)
       */
    }
    return this.moduleExports
  }

  /** Unpatches all patched functions. */
  applyUnpatch (): void {
    // remove all the hook
  }
}

const plugin = new NuxtPlugin('nuxt')
export { plugin }
