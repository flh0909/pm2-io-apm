import Debug from 'debug'
const debug = Debug('axm:tracingactions')

import ActionsFeature from '../features/actions'
import ActionsInterface from './actionsInterface'
import MiscUtils from '../utils/miscellaneous'
import { ServiceManager } from '../serviceManager'
import * as semver from 'semver'

import Tracing from '../features/tracing'

export default class TracingAction implements ActionsInterface {

  private actionFeature: ActionsFeature
  private uuid: string
  private tracing: Tracing | null = null

  constructor (actionFeature: ActionsFeature) {
    this.actionFeature = actionFeature
  }

  async init () {
    debug('init tracing actions')
    const isTracingOk = semver.satisfies(process.version, '>= 10.10.0')
    if (!isTracingOk) return debug('Disabling tracing as node version is less than 10.10')

    this.tracing = new Tracing()
    if (this.tracing === null) return debug('tracing feature not found')
    await this.tracing.init()
    this.exposeActions()
  }

  destroy () {
    if (this.tracing) this.tracing.destroy()
  }

  private async stopTracing (cb) {
    if (this.tracing === null) {
      return cb({
        success: false,
        err: new Error(`Tracing not available`),
        uuid: this.uuid
      })
    }
    try {
      const data = await this.tracing.stop()

      return cb({
        success: true,
        tracing: true,
        dump_file: data,
        dump_file_size: data.length,
        uuid: this.uuid
      })
    } catch (err) {
      return cb({
        success: false,
        err: new Error(`Tracing not available`),
        uuid: this.uuid
      })
    }
  }

  private exposeActions () {
    debug('expose actions')
    if (this.tracing === null) return

    const profilingReply = (data) => ServiceManager.get('transport').send('profilings', {
      data: data.dump_file,
      at: data.at,
      initiated: data.initiated || 'manual',
      duration: data.duration || null,
      type: 'tracing'
    })
    let startTime: Date | null = null
    this.actionFeature.action('km:cpu:tracing:start', async (opts, reply) => {
      startTime = new Date()
      if (!reply) {
        reply = opts
        opts = {}
      }
      if (!opts) opts = {}

      try {
        if (this.tracing === null) throw new Error(`Tracing not available`)

        this.uuid = MiscUtils.generateUUID()
        await this.tracing.start()
        reply({ success : true, uuid: this.uuid })

        if (opts.timeout && typeof opts.timeout === 'number') {
          setTimeout(async _ => {
            await this.stopTracing(data => profilingReply({
              at: startTime,
              initiated: opts.initiated,
              duration: startTime ? new Date().getTime() - startTime.getTime() : null,
              ...data
            }))
          }, opts.timeout)
        }
      } catch (err) {
        return reply({
          success : false,
          err     : err,
          uuid    : this.uuid
        })
      }
    })

    this.actionFeature.action('km:cpu:tracing:stop', this.stopTracing.bind(this, data => profilingReply({
      at: startTime,
      initiated: 'manual',
      duration: startTime ? new Date().getTime() - startTime.getTime() : null,
      ...data
    })))
  }
}
