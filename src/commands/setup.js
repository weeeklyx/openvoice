const { saveGuildSettings, getGuildSettings } = require("../database/dbManager")
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")

module.exports = {

    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Первоначальная настройка OpenVoice"),

    async execute(interaction) {

        if (!interaction.member.permissions.has("Administrator")) {

            return await interaction.reply({
                content: "❌ У вас должны быть права **Администратора** для настройки OpenVoice.",
                ephemeral: true
            })

        }

        const currentSettings = await getGuildSettings(interaction.guildId);

        if (currentSettings && currentSettings.master_channel_id) {
            return await interaction.reply({
                content: "❌ **OpenVoice уже настроен на этом сервере!**\nИспользуйте команду `/settings` для изменения конфигурации или сброса.",
                ephemeral: true
            });
            }

        const setupEmbed = new EmbedBuilder()
            .setTitle("⚙️ OpenVoice - Первоначальная настройка")
            .setColor("#0062ff")
            .setDescription(
                "Привет! Давай настроим OpenVoice для твоего сервера!\n\n" +
                "**Как это работает?** \n\n" +
                "Бот не может просто взять и закинуть кого то в войс. Чтобы ты оказался в отдельной комнате, сначала нужно зайти в какой то другой войс, откуда бот будет перекидывать участников.\n\n" +
                "**Что нужно сделать прямо сейчас?**\n\n" +
                `Если у тебя ещё нет такого канала, то создайте его, а затем нажимайте на кнопку "➡️ Далее"`
            )
            .setFooter({ text: "OpenVoice - первоначальная настройка, 1/3" })

        const row = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("setup_to_step_2")
                .setLabel("➡️ Далее")
                .setStyle(ButtonStyle.Success)

        )

        await interaction.reply({
            embeds: [setupEmbed],
            components: [row],
            ephemeral: true
        })

    },

    async handleButton(interaction) {

        if (interaction.customId === "setup_to_step_2") {

            const step2embed = new EmbedBuilder()
                .setTitle("⚙️ OpenVoice - Выбор главного канала")
                .setColor("#0062ff")
                .setDescription(
                    "Давай выберем канал для создания комнат!\n\n" +
                    "**Что нужно сделать прямо сейчас?**\n\n" +
                    "Выбери в выпадающем списке канал для создания комнаты. Люди будут заходить в него, а бот перекинет их в новый войс."
                )
                .setFooter({ text: "OpenVoice - первоначальная настройка, 2/3" })

            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId("setup_master_channel_select")
                .setPlaceholder("Выбери голосовой канал...")
                .addChannelTypes(ChannelType.GuildVoice)

            const row = new ActionRowBuilder().addComponents(channelSelect)

            return await interaction.update({
                embeds: [step2embed],
                components: [row]
            })

        }


        if (interaction.customId === "setup_skip_modal") {

            const currentSettings = await getGuildSettings(interaction.guildId)
            const masterChannelId = currentSettings ? currentSettings.master_channel_id : null


            await saveGuildSettings(interaction.guildId, masterChannelId, "🎤 Комната {user}", 0)

            const successEmbed = new EmbedBuilder()
                .setTitle("✅ Настройка OpenVoice успешно завершена!")
                .setColor("#2ecc71")
                .setDescription(
                    "Поздравляю! Настройка системы приватных комнат завершена в быстром режиме.\n\n" +
                    "**Примененная конфигурация сервера:**\n" +
                    `- **Мастер-канал:** <#${masterChannelId}>\n` +
                    "- **Шаблон названия:** `🎤 Комната {user}`\n" +
                    "- **Лимит мест по умолчанию:** `Без лимита`\n\n" +
                    "**Что делать дальше?**\n" +
                    "Ты можешь прямо сейчас зайти в указанный голосовой канал, и бот создаст приватную комнату!"
                )
                .setFooter({ text: "OpenVoice - Настройка завершена!" })

            return await interaction.update({
                embeds: [successEmbed],
                components: []
            })

        }


        if (interaction.customId === "setup_open_modal") {

            const modal = new ModalBuilder()
                .setCustomId("setup_config_modal")
                .setTitle("Настройка шаблонов OpenVoice")

            const nameInput = new TextInputBuilder()
                .setCustomId("setup_input_name")
                .setLabel("Шаблон названия комнат")
                .setStyle(TextInputStyle.Short)
                .setValue("🎤 Комната {user}")
                .setRequired(true)

            const limitInput = new TextInputBuilder()
                .setCustomId("setup_input_limit")
                .setLabel("Лимит мест (0 - без лимита)")
                .setStyle(TextInputStyle.Short)
                .setValue("0")
                .setMaxLength(2)
                .setRequired(true)

            const firstRow = new ActionRowBuilder().addComponents(nameInput)
            const secondRow = new ActionRowBuilder().addComponents(limitInput)

            modal.addComponents(firstRow, secondRow)

            return await interaction.showModal(modal)

        }

    },

    async handleSelect(interaction) {

        if (interaction.customId === "setup_master_channel_select") {

            const selectedChannelId = interaction.values[0]
            

            await saveGuildSettings(interaction.guildId, selectedChannelId, "🎤 Комната {user}", 0)

            const step3embed = new EmbedBuilder()
                .setTitle("⚙️ OpenVoice - Базовые настройки шаблонов")
                .setColor("#0062ff")
                .setDescription(
                    "Теперь давай отполируем всё до блеска, изменив стандартные строки!\n\n" +
                    "**Что нужно сделать сейчас?**\n\n" +
                    `Нажми на кнопку "⚙️ Строки" для кастомной настройки или пропусти этот этап по кнопке "⏭️ Пропустить"!`
                )
                .setFooter({ text: "OpenVoice - первоначальная настройка, 3/3" })

            const row = new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId("setup_open_modal")
                    .setLabel("⚙️ Строки")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("setup_skip_modal")
                    .setLabel("⏭️ Пропустить")
                    .setStyle(ButtonStyle.Secondary)

            )


            return await interaction.update({
                embeds: [step3embed],
                components: [row] 
            })

        }

    },


    async handleModal(interaction) {

        if (interaction.customId === "setup_config_modal") {

            const customName = interaction.fields.getTextInputValue("setup_input_name")
            const customLimitRaw = interaction.fields.getTextInputValue("setup_input_limit")
            const customLimit = parseInt(customLimitRaw) || 0

            const currentSettings = await getGuildSettings(interaction.guildId)
            const masterChannelId = currentSettings ? currentSettings.master_channel_id : null

            await saveGuildSettings(interaction.guildId, masterChannelId, customName, customLimit)

            const successEmbed = new EmbedBuilder()
                .setTitle("✅ Настройка OpenVoice успешно завершена!")
                .setColor("#2ecc71")
                .setDescription(
                    `Система приватных комнат настроена!\n\n` +
                    `- **Мастер-канал:** <#${masterChannelId}>\n` +
                    `- **Кастомный шаблон:** \`${customName}\`\n` +
                    `- **Лимит мест:** \`${customLimit === 0 ? "Без лимита" : customLimit}\``
                )
                .setFooter({ text: "OpenVoice - Настройка завершена!" })

            return await interaction.update({
                embeds: [successEmbed],
                components: []
            })

        }

    }

}
