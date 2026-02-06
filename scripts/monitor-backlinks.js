// Script to help monitor backlink discovery
const knownBacklinks = [
  'https://tmahtx.org/resources/',
  // Add other known backlinks here
];

console.log('Known backlinks to monitor:');
knownBacklinks.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
  console.log(`   Check if they link to: https://ftbend-lgbtqia-community.org`);
  console.log(`   Verify anchor text includes: "Fort Bend County LGBTQIA+"`);
  console.log('');
});

// Instructions for manual checking
console.log('Manual verification steps:');
console.log('1. Visit each known backlink URL');
console.log('2. Use Ctrl+F to search for your domain');
console.log('3. Check if link is dofollow (rel="nofollow" not present)');
console.log('4. Verify anchor text is descriptive');
console.log('5. Check if link uses HTTPS');
