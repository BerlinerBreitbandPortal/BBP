const merge = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin  = require('mini-css-extract-plugin');

const webpackBaseConfig = require('./webpack.common.config.js');

module.exports = merge(webpackBaseConfig, {
    mode: 'development',
    output: {
        path: path.resolve(__dirname, '../dev/js'),
        filename: "[name].[chunkhash].js"
    },
    devtool: 'source-map',
    watch: true,
    plugins: [
        new CopyWebpackPlugin([{
            from: './src/login',
            to: '../login'
        }]),
        new MiniCssExtractPlugin({
            filename: '../css/[name].css'
        }),
        new CopyWebpackPlugin([{
            from: './src/video-uploads',
            to: '../video-uploads'
        }])
    ]
});