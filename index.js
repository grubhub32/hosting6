const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const axios = require('axios');
const { createCanvas } = require('canvas');

// Initialize bot
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

// ⚙️ CONFIGURATION (Replace these values!)
const TOKEN = 'MTM3NjYzNDc5MzY1OTMzNDcxNg.GAkMS6.lFF9XIvcoZlIbVklLGNy28e5Q1sLR8oYC-zT60';
const CLIENT_ID = '1376634793659334716';
const MOD_ROLE_ID = '1376633983332515962'; // Role ID for mod commands
const UNSPLASH_KEY = 'TPowW7u1gNGv6QVEzDFBjYDEiJ7aIJ8zNAO-xObZzYY'; // From unsplash.com/developers

// Slash Commands
const commands = [
  // 🎨 Utility & Creative
  {
    name: 'palette',
    description: 'Generates a relaxing color palette',
  },
  {
    name: 'remind',
    description: 'Sets a chill reminder',
    options: [
      { name: 'time', type: 4, description: 'Minutes until reminder', required: true },
      { name: 'task', type: 3, description: 'What to remind you of', required: true },
    ],
  },
  {
    name: 'aesthetic',
    description: 'Sends a random aesthetic mood board',
  },
  {
    name: 'countdown',
    description: 'Counts down to an event',
    options: [
      { name: 'event', type: 3, description: 'Name of the event', required: true },
      { name: 'date', type: 3, description: 'YYYY-MM-DD', required: true },
    ],
  },

  // 😊 Fun & Social
  {
    name: 'hug',
    description: 'Sends a virtual hug',
    options: [
      { name: 'user', type: 6, description: 'Who to hug', required: true },
    ],
  },
  {
    name: 'compliment',
    description: 'Gives a nice compliment',
    options: [
      { name: 'user', type: 6, description: 'Who to compliment', required: false },
    ],
  },
  {
    name: 'meme',
    description: 'Sends a wholesome meme',
  },
  {
    name: 'wouldyourather',
    description: 'Asks a fun "Would You Rather" question',
  },

  // 🛡️ Moderation (Restricted to MOD_ROLE_ID)
  {
    name: 'kick',
    description: 'Kicks a user from the server',
    options: [
      { name: 'user', type: 6, description: 'User to kick', required: true },
      { name: 'reason', type: 3, description: 'Reason for kick', required: false },
    ],
  },
  {
    name: 'ban',
    description: 'Bans a user from the server',
    options: [
      { name: 'user', type: 6, description: 'User to ban', required: true },
      { name: 'reason', type: 3, description: 'Reason for ban', required: false },
    ],
  },
  {
    name: 'clear',
    description: 'Deletes a number of messages',
    options: [
      { name: 'amount', type: 4, description: 'Number of messages to delete (1-100)', required: true },
    ],
  },
];

// Register commands
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Commands registered successfully!');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
})();

// Bot events
client.on('ready', () => {
  console.log(`${client.user.tag} is online!`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member } = interaction;

  // 🛡️ Moderation Commands (Role-restricted)
  if (['kick', 'ban', 'clear'].includes(commandName)) {
    if (!member.roles.cache.has(MOD_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    if (commandName === 'kick') {
      const user = options.getUser('user');
      const reason = options.getString('reason') || 'No reason provided';
      await interaction.guild.members.kick(user, { reason });
      await interaction.reply(`✅ **${user.tag}** has been kicked. Reason: ${reason}`);
    }

    else if (commandName === 'ban') {
      const user = options.getUser('user');
      const reason = options.getString('reason') || 'No reason provided';
      await interaction.guild.members.ban(user, { reason });
      await interaction.reply(`✅ **${user.tag}** has been banned. Reason: ${reason}`);
    }

    else if (commandName === 'clear') {
      const amount = options.getInteger('amount');
      if (amount < 1 || amount > 100) {
        return interaction.reply({
          content: '❌ Please provide a number between 1 and 100.',
          ephemeral: true,
        });
      }
      await interaction.channel.bulkDelete(amount);
      await interaction.reply({
        content: `✅ Deleted **${amount}** messages.`,
        ephemeral: true,
      });
    }
  }

  // 🎨 Utility & Creative Commands
  else if (commandName === 'palette') {
    const colors = ['#E8F7EE', '#B8DFD8', '#7FD6C2', '#4CA1A3', '#3E6B89'];
    const canvas = createCanvas(400, 100);
    const ctx = canvas.getContext('2d');
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * 80, 0, 80, 100);
    });
    const buffer = canvas.toBuffer('image/png');
    await interaction.reply({ 
      files: [new AttachmentBuilder(buffer, { name: 'palette.png' })],
      content: '**🌈 Relaxing Color Palette**' 
    });
  }

  else if (commandName === 'remind') {
    const time = options.getInteger('time');
    const task = options.getString('task');
    setTimeout(() => interaction.user.send(`⏰ **Reminder:** ${task}`), time * 60000);
    await interaction.reply({ 
      content: `✅ I'll remind you in **${time} minutes** to: *"${task}"*`, 
      ephemeral: true 
    });
  }

  else if (commandName === 'aesthetic') {
    const themes = ['cottagecore', 'vaporwave', 'nature', 'cozy'];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    try {
      const response = await axios.get(`https://api.unsplash.com/photos/random?query=${randomTheme}&client_id=${UNSPLASH_KEY}`);
      const embed = new EmbedBuilder()
        .setTitle(`🌿 ${randomTheme.toUpperCase()} Aesthetic`)
        .setImage(response.data.urls.regular)
        .setColor('#B8DFD8');
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Unsplash API error:', error);
      await interaction.reply({
        content: '❌ Failed to fetch an aesthetic image. Try again later!',
        ephemeral: true,
      });
    }
  }

  else if (commandName === 'countdown') {
    const event = options.getString('event');
    const dateStr = options.getString('date');
    const daysLeft = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    await interaction.reply(`⏳ **${daysLeft} days** until **${event}**!`);
  }

  // 😊 Fun & Social Commands
  else if (commandName === 'hug') {
    const user = options.getUser('user');
    const hugs = [
      `🤗 **${interaction.user} hugs ${user}!**`,
      `🫂 **${interaction.user} gives ${user} a warm hug!**`,
      `💖 **${interaction.user} squeezes ${user} gently!**`
    ];
    await interaction.reply(hugs[Math.floor(Math.random() * hugs.length)]);
  }

  else if (commandName === 'compliment') {
    const user = options.getUser('user') || interaction.user;
    const compliments = [
      `✨ **${user.username}**, you're amazing!`,
      `🌼 **${user.username}**, the world is better with you in it!`,
      `🌟 **${user.username}**, your vibes are immaculate!`
    ];
    await interaction.reply(compliments[Math.floor(Math.random() * compliments.length)]);
  }

  else if (commandName === 'meme') {
    const memes = [
      'https://i.imgur.com/xyz123.jpg', // Replace with actual meme URLs
      'https://i.imgur.com/abc456.jpg',
    ];
    await interaction.reply(memes[Math.floor(Math.random() * memes.length)]);
  }

  else if (commandName === 'wouldyourather') {
    const questions = [
      "**Would you rather... have a pet dragon or a pet unicorn?** 🐉🦄",
      "**Would you rather... live in a cozy cabin or a beach house?** 🏡🏖️",
    ];
    await interaction.reply(questions[Math.floor(Math.random() * questions.length)]);
  }
});

client.login(TOKEN);