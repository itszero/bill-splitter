import fs from 'fs';
import groupBy from 'lodash/collection/groupBy';

export function readConfig(file = './settings.json') {
  return JSON.parse(fs.readFileSync(file))
}

/**
 * Decimal adjustment of a number.
 *
 * @param {String}  type  The type of adjustment.
 * @param {Number}  value The number.
 * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
 * @returns {Number} The adjusted value.
 */
function decimalAdjust(type, value, exp) {
  // If the exp is undefined or zero...
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math[type](value);
  }
  value = +value;
  exp = +exp;
  // If the value is not a number or the exp is not an integer...
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }
  // Shift
  value = value.toString().split('e');
  value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
  // Shift back
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

export function round(value, exp) {
  return decimalAdjust('round', value, exp);
}

export function createLogger(name) {
  return function log(...args) {
    return console.log(`[${name}]`, ...args);
  }
}

export function mergeSamePersonLines(lines) {
  const grouped = groupBy(lines, (line) => line.name);
  return Object.keys(grouped).map((name) => {
    const group = grouped[name];
    return group.reduce((ret, line) => {
      ret.amount += line.amount;
      return ret;
    }, {
      name,
      amount: 0
    });
  });
}

export function addSharedCost(lines, totalSharedCosts) {
  const share = totalSharedCosts / lines.length;
  return lines.map((line) => {
    line.shared = share;
    line.total = line.amount + line.shared;
    return line;
  });
}