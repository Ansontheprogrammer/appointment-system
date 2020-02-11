import * as assert from 'assert'
import { formatToCronTime } from '../config/utils'
import { createJob, appointmentsInQueue, clearQueue, cancelJob } from '../lib/cron'

describe('Cron Jobs', () => {
  afterEach(() => {
    clearQueue()
  })

  it('should format dateTime to correct cron format', () => {
    const result = formatToCronTime('2019-09-13 12:00')
    assert.equal(result, '0 0 11 13 8 *')
  })

  it('should create a cron job', () => {
    const date = '2019-09-13 10:01'
    const phoneNumber = '9082097544'
    const id = '90832fefe'
    createJob(formatToCronTime(date), phoneNumber, 'Creating dummy reminder', id)
    assert.equal(appointmentsInQueue[0][0], id)
  })

  it('should cancel a cron job', () => {
    const date = '2019-09-13 10:01'
    const phoneNumber = '9082097544'
    const id = '90832fefe'
    // create a job
    createJob(formatToCronTime(date), phoneNumber, 'Creating dummy reminder', id)
    assert.equal(appointmentsInQueue.length, 1, 'Appointment created')
    // cancel job
    cancelJob(id)
    assert.equal(appointmentsInQueue.length, 0)
  })

  it('should clear all jobs', () => {
    const date = '2019-09-13 10:01'
    const phoneNumber = '9082097544'
    const id = '90832fefe'
    // create a job
    createJob(formatToCronTime(date), phoneNumber, 'Creating dummy reminder', id)
    assert.equal(appointmentsInQueue.length, 1, 'Appointment created')
    // create a job
    createJob(formatToCronTime(date), phoneNumber, 'Creating dummy reminder 2', id)
    assert.equal(appointmentsInQueue.length, 2, 'Appointment created')
    // cancel job
    clearQueue()
    assert.equal(appointmentsInQueue.length, 0)
  })
})

