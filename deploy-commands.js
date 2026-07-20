const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
  {
    name: 'painel-set',
    description: 'Abrir painel de solicitação'
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(
      '1528621803440963604',
      '1192191259259969626'
    ),
    { body: commands }
  );

  console.log('Comando registrado!');
})();