
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder
} = require('discord.js');

require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// 🔥 CONFIG
const CANAL_STAFF = '1527387879506972712';

// 🔥 SALVAR DADOS TEMPORÁRIOS
const dadosUsuarios = new Map();
const solicitacoesAtivas = new Set();

// 🔥 CARGOS
const CARGOS_PERMITIDOS = [
  { label: 'Aguardando Indicação', value: '1522679986115313704' },
  { label: 'Indicado', value: '1513683130329075904' },
  { label: 'Morador', value: '1528644783722205194' },
  { label: 'Membro', value: '1383265179814596628' },
  { label: 'Soldado', value: '1528644941247680634' },
  { label: 'Gerencia', value: '1528645075326730293' },
  { label: 'Gerente de Venda', value: '1521362845889990666' },
  { label: 'Gerente de Farm', value: '1522374130442436738' },
  { label: 'Gerente de Ação', value: '1519848020949073940' },
  { label: 'Gerente Geral', value: '1515034002933682348' },
  { label: '03', value: '1516498757695574157' },
  { label: '02', value: '1516498493940699177' },
  { label: '01', value: '1192191893174485062' }
];

client.once('ready', () => {
  console.log(`✅ Logado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {

    // ========================
    // 🔥 /painel-set
    // ========================
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'painel-set') {

        const embed = new EmbedBuilder()
          .setTitle('📋 Solicitar Set')
          .setDescription('Clique no botão abaixo para iniciar seu cadastro.')
          .setColor('#00BFFF')
          .setImage('https://media.discordapp.net/attachments/1498166599495192727/1528121557120057404/file_0000000096fc820eb5d31fb36a7ab5fb.png?ex=6a5e771a&is=6a5d259a&hm=d134d2644a6673a1b4d88585889f2e5411a2376e9f75cb188315ef44a1d93c3d&=&format=webp&quality=lossless&width=1768&height=707')
          .setFooter({ text: 'Sistema de Registro • CALI' })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('abrir_form')
            .setLabel('Registrar-se')
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          embeds: [embed],
          components: [row]
        });
      }
    }

    // ========================
    // 🔥 ABRIR FORM
    // ========================
    if (interaction.isButton() && interaction.customId === 'abrir_form') {

      if (solicitacoesAtivas.has(interaction.user.id)) {
        return interaction.reply({
          content: '⚠️ Você já tem uma solicitação em andamento.',
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId('formulario_set')
        .setTitle('Solicitar Set');

      const nome = new TextInputBuilder()
        .setCustomId('nome')
        .setLabel('Nome do Personagem')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const passaporte = new TextInputBuilder()
        .setCustomId('passaporte')
        .setLabel('Passaporte')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const telefone = new TextInputBuilder()
        .setCustomId('telefone')
        .setLabel('Telefone In Game')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nome),
        new ActionRowBuilder().addComponents(passaporte),
        new ActionRowBuilder().addComponents(telefone)
      );

      return interaction.showModal(modal);
    }

    // ========================
    // 🔥 ENVIO FORM
    // ========================
    if (interaction.isModalSubmit() && interaction.customId === 'formulario_set') {

      await interaction.deferReply({ ephemeral: true });

      solicitacoesAtivas.add(interaction.user.id);

      const nome = interaction.fields.getTextInputValue('nome');
      const passaporte = interaction.fields.getTextInputValue('passaporte');
      const telefone = interaction.fields.getTextInputValue('telefone') || 'Não informado';

      // 🔥 SALVA NOME E PASSAPORTE
dadosUsuarios.set(interaction.user.id, {
  nome,
  passaporte
});

      const embed = new EmbedBuilder()
        .setTitle('📥 Nova Solicitação')
        .setColor('#00BFFF')
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '👤 Usuário', value: `${interaction.user}`, inline: false },
          { name: '📛 Nome', value: nome, inline: true },
          { name: '🪪 Passaporte', value: passaporte, inline: true },
          { name: '📱 Telefone', value: telefone, inline: true }
        )
        .setTimestamp();

      const botoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`aprovar_${interaction.user.id}`)
          .setLabel('Aprovar')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`reprovar_${interaction.user.id}`)
          .setLabel('Reprovar')
          .setStyle(ButtonStyle.Danger)
      );

      const canal = await client.channels.fetch(CANAL_STAFF);

      await canal.send({
        embeds: [embed],
        components: [botoes]
      });

      await interaction.editReply({
        content: '✅ Sua solicitação foi enviada para análise!'
      });
    }

    // ========================
    // 🔥 APROVAR → MENU
    // ========================
    if (interaction.isButton() && interaction.customId.startsWith('aprovar_')) {

      const userId = interaction.customId.split('_')[1];

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`selectcargo_${userId}`)
        .setPlaceholder('Escolha o cargo')
        .addOptions(CARGOS_PERMITIDOS);

      return interaction.reply({
        content: '🎯 Selecione o cargo:',
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true
      });
    }

    // ========================
    // 🔥 ESCOLHER CARGO + NOME CERTO
    // ========================
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('selectcargo_')) {

      await interaction.deferUpdate();

      const userId = interaction.customId.split('_')[1];
      const cargoId = interaction.values[0];

      const membro = await interaction.guild.members.fetch(userId);
      const cargo = interaction.guild.roles.cache.get(cargoId);

      await membro.roles.add(cargoId);

// 🔥 PEGA DADOS DO FORM
const dados = dadosUsuarios.get(userId);

const nomeForm = dados?.nome || membro.user.username;
const passaporte = dados?.passaporte || "0000";

// 🔥 PEGA A SIGLA DO NOME DO CARGO
const match = cargo.name.match(/\[\s*(.*?)\s*\]/);

const sigla = match ? match[1] : "";

// 🔥 NOVO NICK
const novoNick = `[ ${sigla} ] ${nomeForm} | ${passaporte}`;

// 🔥 ALTERA O NICK
await membro.setNickname(novoNick).catch(console.error);

solicitacoesAtivas.delete(userId);
dadosUsuarios.delete(userId);

try {
  await membro.send(`✅ Você foi aprovado como **${cargo.name}**!`);
} catch {}

await interaction.editReply({
  content: "✅ Cargo + nome aplicado!",
  components: []
});

await interaction.message.edit({ components: [] });

} // <-- FECHA O IF DO SELECTCARGO

// ========================
// 🔥 REPROVAR
// ========================
if (interaction.isButton() && interaction.customId.startsWith('reprovar_')) {

      const userId = interaction.customId.split('_')[1];

      const modal = new ModalBuilder()
        .setCustomId(`modal_reprovar_${userId}`)
        .setTitle('Motivo da reprovação');

      const motivo = new TextInputBuilder()
        .setCustomId('motivo')
        .setLabel('Digite o motivo')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(motivo)
      );

      return interaction.showModal(modal);
    }

    // ========================
    // 🔥 CONFIRMAR REPROVAÇÃO
    // ========================
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_reprovar_')) {

      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.customId.split('_')[2];
      const motivo = interaction.fields.getTextInputValue('motivo');

      solicitacoesAtivas.delete(userId);
      dadosUsuarios.delete(userId);

      const membro = await interaction.guild.members.fetch(userId);

      try {
        await membro.send(`❌ Sua solicitação foi recusada.\n\nMotivo: ${motivo}`);
      } catch {}

      await interaction.editReply({
        content: '❌ Usuário reprovado!'
      });

      await interaction.message.edit({ components: [] });
    }

  } catch (err) {
    console.error('ERRO:', err);
  }
});

// 🔥 ANTI-CRASH
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// 🔥 LOGIN
client.login(process.env.TOKEN);

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot de set online!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log("Web server ativo");
});