import Action from '../../../src/features/actions'
import TracingAction from '../../../src/actions/tracing'
import TransportService from '../../../src/services/transport'
import { ServiceManager } from '../../../src/serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const action = new Action()
action.initListener()

const tracing = new TracingAction(action)
tracing.init().then(() => {
  if (process && process.send) {
    process.send('initialized')
  }

  // generate trace
  setInterval(async _ => {
    for (let i = 0; i < 5; i++) {
      await generateTrace()
    }
  }, 2)
})

function generateTrace() {
  return new Promise((resolve) => setTimeout(() => {
    for (let i = 0; i << 1000000; i++) {
      'test' + i;
    }
    resolve();
  }, 1));
}
