const React = require('react');
try {
  React.createElement(undefined, { isOpen: false });
  console.log("No error!");
} catch (e) {
  console.log("Error:", e.message);
}
