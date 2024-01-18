const pool = require('../lib/database').connection;

/**
 * This function generates a AlphaNumeric Code of length 8 which contains a combination of 4 characters and 4 numbers respectively.
 * @param count - Total length of the code required
 * @returns {string} - Returns the code as in format CCCCNNNN(C- Character, N- Number). Ex - SEQD3212.
 */
function generateClassCode(count) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let numbers = '0123456789'.split('');
    let number = '';
    let word = '';
    for (let i = 0; i < count / 2; i++) {
        let x = Math.floor(Math.random() * numbers.length);
        number += numbers[x];
    }
    for (let i = 0; i < count / 2; i++) {
        let x = Math.floor(Math.random() * chars.length);
        word += chars[x];
    }
    return word + number;
}

/**
 * This function checks whether the code is randomly generated class code has already been used and returns a fresh one.
 * It uses recursive functionality for this.
 * @param callback - Passes code through callback or null in case of database error
 */
const getClassCode = (callback) => {
    let code = generateClassCode(8);
    const query = 'select class_code from public.class_table where class_code=$1;';
    const values = [code];

    pool.query(query, values, (error, result) => {
        if (error) {
            console.log('DB Error' + error);
            callback(null);
        }
        if (result.rows.length > 0) {
            getClassCode(callback);
        } else {
            callback(code);
        }
    });
};

module.exports = {
    getClassCode
};