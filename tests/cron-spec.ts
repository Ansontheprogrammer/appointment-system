import * as assert from 'assert'
import { formatToCronTime } from '../config/utils'

describe('Cron job time formatter', () => {
  it('should format dateTime to correct cron format', () => {
    const result = formatToCronTime('2019-09-13 12:00')
    assert.equal(result, '0 0 11 13 8 *')
  })
})
