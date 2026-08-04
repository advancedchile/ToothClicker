const babel = require('@babel/core');
try {
  babel.transformFileSync('app.jsx', {
    presets: ['@babel/preset-react'],
    plugins: ['@babel/plugin-proposal-optional-chaining', '@babel/plugin-proposal-nullish-coalescing-operator']
  });
  console.log("No syntax errors in app.jsx!");
} catch (err) {
  console.error("Syntax Error: " + err.message);
}
