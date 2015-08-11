var webpack = require('webpack');

module.exports = {
    entry: "./index.js",
    output: {
        filename: "index.js",
        path: "./dist"
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel',
                query: {
                    optional: ['runtime'],
                    stage: 0
                }
            }
        ]
    }
}