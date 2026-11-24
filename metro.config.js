// Metro (the Expo bundler) configuration.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// The Next.js backend has its own node_modules (a different React version).
// Make sure the mobile app never scans or bundles anything from it.
const backendDir = path.join(__dirname, "backend").replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
config.resolver.blockList = [...[].concat(config.resolver.blockList || []), new RegExp(`^${backendDir}[\\\\/].*`)];

module.exports = config;
