// api/bot.js

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const PREFIX = '!'; // Command prefix
const APPROVED_USERS = ['1239486833079881850']; // Replace with your Discord user ID
const ADMIN_CHANNEL = 'channel-approval'; // The channel where you'll approve requests

client.once('ready', () => {
    console.log('Bot is online and ready!');
});

// Bot event to handle messages
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(`${PREFIX}createchannel`)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const channelName = args[1];

        if (!channelName) {
            return message.reply('Please provide a channel name!');
        }

        if (!APPROVED_USERS.includes(message.author.id)) {
            return message.reply('You are not authorized to request channel creation!');
        }

        // Send request to an approval channel
        const approvalChannel = message.guild.channels.cache.find(ch => ch.name === ADMIN_CHANNEL);
        if (!approvalChannel) {
            return message.reply(`Approval channel "${ADMIN_CHANNEL}" not found.`);
        }

        // Send a message to approve the channel creation
        const requestMessage = await approvalChannel.send(`User ${message.author.tag} requested to create a channel named **${channelName}**. Type !approve ${message.author.id} to approve, or !deny ${message.author.id} to deny.`);

        // Add reactions to approve or deny
        await requestMessage.react('✅'); // approve
        await requestMessage.react('❌'); // deny

        // Listen for the reactions
        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && APPROVED_USERS.includes(user.id);
        };

        const collector = requestMessage.createReactionCollector({ filter, time: 60000 });

        collector.on('collect', async (reaction, user) => {
            if (reaction.emoji.name === '✅') {
                // Create the channel if approved
                await message.guild.channels.create(channelName, {
                    type: 'GUILD_TEXT',
                    topic: `Channel requested by ${message.author.tag}`,
                    permissionOverwrites: [
                        {
                            id: message.guild.id,
                            deny: ['SEND_MESSAGES'], // Default permission to deny messages for everyone
                        },
                    ],
                });

                message.reply(`Your channel request has been approved!`);
            } else if (reaction.emoji.name === '❌') {
                message.reply('Your channel request has been denied.');
            }
        });

        collector.on('end', () => {
            requestMessage.delete(); // Delete the approval request after 1 minute
        });
    }
});

// This is for Vercel to start the bot.
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        // Trigger bot interaction here, since Vercel is stateless, we don't keep it running as usual
        await client.login('MTM1MjI2Mzc4NDQ3OTMyNjIzOA.GNvtMM.8gJrKuEJUJF6UT4q3DSYeRyqmUc8GeBFh3EAO8'); // Replace with your bot token
        res.status(200).send('Bot is online');
    } else {
        res.status(405).send('Method Not Allowed');
    }
};
