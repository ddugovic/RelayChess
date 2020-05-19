const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        app: './src/app/app.js'
    },
    module: {
        rules: [
            { test: /\.html$/,
              use: 'raw-loader' }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            inject: 'head'
        }),
        new CopyWebpackPlugin([
            { from: './src/assets/',
              to: 'assets/' },
            { from: './src/styles/',
              to: 'styles/' },
            { from: './src/app/lib/stockfish.js',
              to: 'lib/stockfish.js' }
        ])
    ],
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist')
    },
};
