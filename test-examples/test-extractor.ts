import { TypeScriptExtractor } from '../src/extractor.js';
import * as path from 'path';

const extractor = new TypeScriptExtractor();
const sampleFile = path.join(process.cwd(), 'test-examples', 'sample.ts');

console.log('Testing TypeScript Extractor\n');
console.log('='.repeat(80));

const testCases = [
  { name: 'fetchUser', description: 'Class method (async)' },
  { name: 'formatUserName', description: 'Static class method' },
  { name: 'calculateTotal', description: 'Standalone function' },
  { name: 'formatDate', description: 'Arrow function' },
  { name: 'useUserData', description: 'Complex arrow function with hooks' },
  { name: 'nonExistent', description: 'Non-existent method (should error)' },
];

for (const testCase of testCases) {
  console.log(`\nTest: ${testCase.name} (${testCase.description})`);
  console.log('-'.repeat(80));

  const result = extractor.extractMethod(sampleFile, testCase.name);

  if (result.success) {
    console.log('\n=== IMPORTS ===');
    console.log(result.imports || '(No imports used)');
    console.log('\n=== METHOD BODY ===');
    console.log(result.methodBody);
  } else {
    console.log('\nERROR:', result.error);
  }

  console.log('='.repeat(80));
}
