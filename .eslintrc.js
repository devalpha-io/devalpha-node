let path = require('path')
module.exports = {
  "extends": [
    "airbnb-base"
  ],
  "rules": {
    "arrow-parens": 0,
    "comma-dangle": ["error", "never"],
    "consistent-return": 0,
    "func-names": 0,
    "generator-star-spacing": 0,
    "import/no-extraneous-dependencies": ["error", {
      "devDependencies": ["**/tests/**/*", "**/scripts/**/*", "rollup.config.js"]
    }],
    "import/no-named-as-default-member": 0,
    "indent": ["error", 2],
    "max-len": ["error", { "code": 120 }],
    "no-await-in-loop": 0,
    "no-case-declarations": 0,
    "no-cond-assign": ["error", "except-parens"],
    "no-console": 0,
    "no-continue": 0,
    "no-param-reassign": 0,
    "no-restricted-syntax": ["off", "BinaryExpression[operator='of']"],
    "no-underscore-dangle": 0,
    "no-unused-vars": ["warn", { "argsIgnorePattern": "next|reject|store|action" }],
    "no-use-before-define": ["error", { "functions": false }],
    "padded-blocks": 0,
    "semi": ["error", "never"]
  },
  "settings": {
    "import/resolver": {
      "node": {
        "paths": [
          path.resolve(__dirname, 'dist')
        ]
      }
    }
  }
}
