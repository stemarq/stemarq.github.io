// Só para a gravação na web: o Metro resolvia "punycode" para o módulo do Node (vazio no navegador)
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const original = config.resolver.resolveRequest;
config.resolver.resolveRequest = (ctx, name, platform) => {
  if (name === 'punycode') return { type: 'sourceFile', filePath: require.resolve('punycode/punycode.js') };
  return (original || ctx.resolveRequest)(ctx, name, platform);
};
module.exports = config;
