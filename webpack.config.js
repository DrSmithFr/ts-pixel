const path = require('path');

module.exports = {
    entry: './src/index.ts',

    output: {
        filename: 'go-pixel.js',
        path: path.resolve(__dirname, 'public/dist'),
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },

    devtool: 'source-map',

    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000,
    },
};