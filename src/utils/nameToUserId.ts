export function nameToUserId(name: string): string {
  return name
    .toLowerCase() // Convert to lowercase
    .normalize('NFD') // Decompose characters with accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
}

// Example usage:
// const userId = nameToUserId("Lyne Legault Groulx");
// Result: "lyne-legault-groulx"
