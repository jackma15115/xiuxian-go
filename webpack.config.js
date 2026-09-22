const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: '*.html', to: '[name][ext]' },
        { 
          from: '*.js', 
          to: '[name][ext]', 
          globOptions: { 
            ignore: ['**/webpack.config.js'] 
          } 
        },
        { from: 'css', to: 'css', noErrorOnMissing: true },
        { from: 'js', to: 'js', noErrorOnMissing: true },
        { from: 'img', to: 'img', noErrorOnMissing: true },
        { from: 'mobile', to: 'mobile', noErrorOnMissing: true },
        { from: 'mfszy', to: 'mfszy', noErrorOnMissing: true },
        { from: 'xiandai', to: 'xiandai', noErrorOnMissing: true },
      ],
    }),
  ],
};
