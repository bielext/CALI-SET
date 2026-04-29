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
      '1498464440352243906',
      '1498173549486280846'
    ),
    { body: commands }
  );

  console.log('Comando registrado!');
})();