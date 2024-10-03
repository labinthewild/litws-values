var path = require("path");

var config = {
<<<<<<<< HEAD:src/litw-values/webpack.config.js
    mode: 'development',
  // mode: 'production',
  entry: path.join(__dirname, "study-main.js"),
  output: {
    path: path.join(__dirname, "js"),
    filename: "bundle-litw-values.min.js"
========
  // mode: 'development',
  mode: 'production',
  entry: path.join(__dirname, "study.js"),
  output: {
    path: path.join(__dirname, "js"),
    filename: "study-bundle.min.js"
>>>>>>>> v2-dev-base:src/frame-line/webpack.config.js
  },
  module: {
    rules: [
        {
          test: require.resolve('jquery'),
            use: [{
              loader: 'expose-loader',
              options: {
                exposes: "jquery",
              },
            },
            {
              loader: 'expose-loader',
              options: {
                exposes: '$',
              },
            }
            ]
        },
        {
          test: /.*\.html$/, loader: "handlebars-loader"
        }
    ]
  },
  externals: [
    /^(jquery.i18n|\$)$/i,
    {
       d3: "d3"
    }
  ],
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "url": false
    },
  }
};

module.exports = config;