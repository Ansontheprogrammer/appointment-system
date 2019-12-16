import 'mocha';
import * as assert from 'assert';
import { extractNumberFromMessage } from '../config/utils';

describe('Helper Functions', () =>{
    it('should extract number', () => {
        const extractedNumber = extractNumberFromMessage('4');
        assert.equal(extractedNumber, '4');
    })
    it('should extract number - even with space after', () => {
        const extractedNumber = extractNumberFromMessage('4 ');
        assert.equal(extractedNumber, '4');
    })
    it('should extract number - even with letters', () => {
        const extractedNumber = extractNumberFromMessage('4a');
        assert.equal(extractedNumber, '4');
    })
})