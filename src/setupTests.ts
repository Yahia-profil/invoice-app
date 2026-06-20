import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for jsdom (required by jsPDF)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
