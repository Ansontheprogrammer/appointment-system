import 'mocha';
import * as assert from 'assert';
import { Database, BARBER } from '../lib/database';
import sinon from 'sinon';

describe('Database class', () => {
    // const database = new Database();
    
    // let sandbox;

    // beforeEach(() => {
    //     // stub out all database functions
    //     sandbox = sinon.createSandbox()
    // })

    // afterEach(() => {
    //     // restore all mongo db functions
    //     sandbox.restore();
    // })

    describe('firstLetterUpperCase', () => {
        it('it should change letter to upperCase', () => {
            const name = Database.firstLetterUpperCase('anson')
            assert.equal(name, 'Anson');
        })
    })
})