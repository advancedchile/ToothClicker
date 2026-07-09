import reactPlugin from "eslint-plugin-react"; export default [{ files: ["**/*.jsx"], plugins: { react: reactPlugin }, languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } }];
