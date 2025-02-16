import { nameToUserId } from '../utils/nameToUserId';

const name = 'Lyne Legault Groulx';
const userId = nameToUserId(name);

console.log('Original name:', name);
console.log('Converted userId:', userId);
