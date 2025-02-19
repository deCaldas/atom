const crypto = require('crypto');
const path = require('path');
const { TypeScriptSimple } = require('typescript-simple');

const defaultOptions = {
  target: 1,
  module: 'commonjs',
  sourceMap: true
};

const typescriptVersion = require('typescript-simple/package.json').version;
const typescriptVersionDir = path.join('ts', createVersionAndOptionsDigest(typescriptVersion, defaultOptions));

function createVersionAndOptionsDigest(version, options) {
  const hash = crypto.createHash('sha256');
  hash.update('typescript', 'utf8');
  hash.update('\0', 'utf8');
  hash.update(version, 'utf8');
  hash.update('\0', 'utf8');
  hash.update(JSON.stringify(options), 'utf8');
  return hash.digest('hex');
}

function getCachePath(sourceCode) {
  if (!sourceCode) throw new Error('Source code is required');
  
  const hash = crypto.createHash('sha256').update(sourceCode, 'utf8').digest('hex');
  return path.join(typescriptVersionDir, `${hash}.js`);
}

function formatFilePathForPlatform(filePath) {
  if (process.platform === 'win32') {
    return `file:///${path.resolve(filePath).replace(/\\/g, '/')}`;
  }
  return filePath;
}

function compile(sourceCode, filePath) {
  if (!sourceCode || !filePath) throw new Error('Source code and file path are required');

  const formattedFilePath = formatFilePathForPlatform(filePath);
  const options = { filename: formattedFilePath, ...defaultOptions };
  const compiler = new TypeScriptSimple(options, false);
  return compiler.compile(sourceCode, formattedFilePath);
}

module.exports = {
  shouldCompile: () => true,
  getCachePath,
  compile
};
