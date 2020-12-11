const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const MiniCssExtractPlugin  = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        app: './src/js/index.js',
        'log-in': './src/js/login.js',
        iframe: './src/js/iframe.js'
    },
    module: {
        rules: [
            {
                test: [/.js$/],
                exclude: [/node_modules/, /login/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                useBuiltIns: "usage",
                                corejs: 3
                            }]
                        ]
                    }
                },
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: '../../'
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: { url: false }
                    }
                ]
            },

            {
                test: /\.(jpg|jpeg|png|gif|svg)$/,
                exclude: [/node_modules/, /login/],
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'img'
                    },
                },
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.php',
            filename: '../index.php',
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: './src/login.php',
            filename: '../login.php',
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: './src/logout.php',
            filename: '../logout.php',
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: './src/iframe.html',
            filename: '../iframe.html',
            chunks: ['iframe'],
            inject: true
        }),
        new CleanWebpackPlugin(),
        new ManifestPlugin({
            fileName: ('../manifest.json'),
            filter: (file) => {
                if (file.path.match(/..\/login/) || file.path.match(/..\/img/) || file.path.match(/.php/)) {
                    return false;
                }
                return true;
            },
            map: (file) => {
                if (file.path.match(/css/)) {
                    // file.name = './css/' + file.name;
                    // file.name = file.path;

                    file.path = file.path.replace('../', './');
                } else if (file.path.match(/.js/)) {
                    file.path = './js/' + file.path;
                }
                return file;
            },
        }),
        new CopyWebpackPlugin([{
            from: './src/img',
            to: '../img'
        }]),
        new CopyWebpackPlugin([{
            from: './src/lang',
            to: '../lang'
        }]),
        new CopyWebpackPlugin([{
            from: './src/breitbandconfig',
            to: '../breitbandconfig'
        }]),
        new CopyWebpackPlugin([{
            from: './src/php',
            to: '../php'
        }]),
        new CopyWebpackPlugin([{
            from: './src/fonts',
            to: '../fonts'
        }]),
        new CopyWebpackPlugin([{
            from: './src/data',
            to: '../data'
        }]),
        new CopyWebpackPlugin([{
            from: './node_modules/datatables.net-dt/images',
            to: '../img'
        }])
    ]
};
