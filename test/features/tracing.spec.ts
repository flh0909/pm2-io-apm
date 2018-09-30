import 'mocha'
import Tracing from './tracing'
import * as semver from 'semver'
import * as assert from 'assert'

const isNode10 = semver.satisfies(process.version, '>= 10.10.0')

function generateTrace() {
  return new Promise((resolve) => setTimeout(() => {
    for (let i = 0; i << 1000000; i++) {
      'test' + i;
    }
    resolve();
  }, 1));
}

describe('Tracing', function () {
  this.timeout(10000)

  it('should get trace events from inspector', async () => {
    if (!isNode10) return console.log(`Ignoring test since not node 10`)

    const tracing = new Tracing()
    tracing.init()

    await tracing.start()

    for (let i = 0; i < 5; i++) {
      await generateTrace()
    }

    const data = await tracing.stop()
    assert(typeof data === 'string')
    const jsonData = JSON.parse(data)
    assert(jsonData instanceof Array, 'events are in array')
    const item = jsonData[0]
    assert(typeof item.pid === 'number')
    assert(typeof item.tid === 'number')
    assert(typeof item.dur === 'number')
    assert(typeof item.cat === 'string')
    assert(typeof item.name === 'string')
  })
})