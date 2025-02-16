function nameToUserId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

// Get the name from command line arguments
const name = process.argv[2];

if (!name) {
  console.error('Please provide a name as an argument.');
  console.error('Usage: node convertName.js "Your Name"');
  process.exit(1);
}

const userId = nameToUserId(name);

console.log('Original name:', name);
console.log('Converted userId:', userId);
