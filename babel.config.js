module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Permet d'importer les fichiers .sql des migrations Drizzle comme des chaînes.
      // Requis par drizzle-orm/expo-sqlite/migrator.
      ['inline-import', { extensions: ['.sql'] }],
    ],
  };
};
