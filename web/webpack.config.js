'use strict';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
    mode: 'development',
    devtool: 'eval-source-map',
    entry: {
        app: './src/app/app.js'
    },
    output: {
        filename: 'app.js'
    },
    module: {
        rules: [
            { test: /\.html$/,
              use: 'raw-loader' }
        ]
    },
    plugins: [
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
    ]
};

module.exports = config;
