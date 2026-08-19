import path from "node:path";
import { fileURLToPath } from "url";
import webpack from "webpack";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version || '1.0.0';
const isDev = process.env.NODE_ENV === 'development';
const versionString = `${version}`;

const config = {
  entry: "./src/predbat-card.ts",
  mode: 'development',
  devtool: isDev ? 'inline-source-map' : false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: [ /node_modules/ ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    // Inject version and environment variables
    new webpack.DefinePlugin({
        'process.env.PREDBAT_VERSION': JSON.stringify(versionString),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    })
  ],
  output: {
    filename: "predbat-card.js",
    path: path.resolve(__dirname, "dist"),
  },
};

export default config;