// Suppress the punycode deprecation warning
const originalWarn = process.emitWarning;
process.emitWarning = (...args) => {
  if (args[2] === 'DEP0040') return;
  return originalWarn.apply(process, args);
};
