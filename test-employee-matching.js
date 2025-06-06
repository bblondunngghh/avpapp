// Test script to verify employee matching logic works for all employees
const { matchEmployee } = require('./client/src/lib/employee-utils');

// Test data from actual database
const testCases = [
  // Ryan's case (already fixed)
  { 
    shiftEmployee: { name: "ryan" },
    dbEmployee: { key: "ryan", fullName: "Ryan Hocevar" },
    expected: true
  },
  // Dave's case
  {
    shiftEmployee: { name: "dave" },
    dbEmployee: { key: "dave", fullName: "Dave Roehm" },
    expected: true
  },
  // Kevin's case
  {
    shiftEmployee: { name: "kevin" },
    dbEmployee: { key: "kevin", fullName: "Kevin Hanrahan" },
    expected: true
  },
  // Antonio's case
  {
    shiftEmployee: { name: "antonio" },
    dbEmployee: { key: "antonio", fullName: "Antonio Martinez" },
    expected: true
  },
  // Test case sensitivity
  {
    shiftEmployee: { name: "BRETT" },
    dbEmployee: { key: "brett", fullName: "Brett Willson" },
    expected: true
  },
  // Test partial name match
  {
    shiftEmployee: { name: "jon" },
    dbEmployee: { key: "jonathan", fullName: "Jonathan Zaccheo" },
    expected: true
  }
];

console.log('Testing employee matching logic...');
testCases.forEach((test, index) => {
  const result = matchEmployee(test.shiftEmployee, test.dbEmployee);
  const status = result === test.expected ? 'PASS' : 'FAIL';
  console.log(`Test ${index + 1}: ${status} - ${test.shiftEmployee.name} -> ${test.dbEmployee.key} (${result})`);
});