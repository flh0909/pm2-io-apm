import Debug from 'debug'
const debug = Debug('axm:tracing')
import ProfilingType from '../profiling/profilingType'
import { ServiceManager } from '../serviceManager'
import { InspectorService } from '../services/inspector'

export interface TraceEvent {
  pid: Number
  tid: Number
  ts: Number
  tts: Number
  name: String
  cat: String
  dur: Number
  tdur: Number
  args: Object
}

export interface TraceEventsCollection {
  value: TraceEvent[]
}

export interface TraceEventsCollected {
  method: String,
  data: TraceEventsCollection
}

export default class Tracing implements ProfilingType {

  private inspectorService: InspectorService
  private traceConfig: Object = {
    includedCategories: ['node', 'v8'],
    recordContinuously: true
  }

  constructor () {
    this.inspectorService = ServiceManager.get('inspector')
  }

  init () {
    debug('init tracing feature')
    if (!this.inspectorService) throw new Error(`Inspector service not initialized`)
    this.inspectorService.createSession()
    this.inspectorService.connect()
  }

  destroy () {
    this.inspectorService.disconnect()
  }

  async start () {
    debug('starting collection trace events data')
    return this.inspectorService.post('NodeTracing.start', {
      traceConfig: this.traceConfig
    })
  }

  async stop (): Promise<string> {
    return this.getProfileInfo()
  }

  private getProfileInfo (): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const buffer: TraceEventsCollection[] = []
        const onTracingData = (event: TraceEventsCollected) => {
          debug('receiving trace events data')
          buffer.push(event.data)
        }
        const onTracingEnd = _ => {
          // cleanup listeners
          debug('received end of trace events')
          this.inspectorService.removeListener('dataCollected', onTracingData)
          this.inspectorService.removeListener('tracingComplete', onTracingEnd)
          const flattenEvents = buffer.reduce((agg: TraceEvent[], events: TraceEventsCollection) => {
            agg = agg.concat(events.value)
            return agg
          }, [])
          return resolve(JSON.stringify(flattenEvents))
        }

        this.inspectorService.on('NodeTracing.dataCollected', onTracingData)
        this.inspectorService.on('NodeTracing.tracingComplete', onTracingEnd)
        // stop tracing
        await this.inspectorService.post('NodeTracing.stop', {
          traceConfig: this.traceConfig
        })
      } catch (err) {
        debug('tracing stopped !')
        return reject(err)
      }
    })
  }
}
