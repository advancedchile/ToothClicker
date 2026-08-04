const babel = require('@babel/core');
const code = `function AboutModal() {}`;
const result = babel.transform(code, { presets: ['@babel/preset-react', '@babel/preset-env'] });
console.log(result.code);
