const { getGuildSettings } = require("../database/dbManager")
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Панель управления настройками OpenVoice")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        const config = await getGuildSettings(interaction.guildId)


        if (!config || !config.master_channel_id) {
            return await interaction.reply({
                content: "❌ **Бот еще не настроен на этом сервере!**\nПожалуйста, сначала выполните первоначальную настройку через `/setup`.",
                ephemeral: true
            })
        }


        const settingsEmbed = new EmbedBuilder()
            .setTitle("🛠️ Настройка панели OpenVoice")
            .setColor("#0062ff")
            .setDescription(
                "Добро пожаловать в конфигуратор панели комнат! Используйте выпадающее меню ниже, чтобы кастомизировать интерфейс.\n\n" +
                "**Текущие настройки кнопок:**\n" +
                `- Кнопка «Запереть»: \`${config.btn_lock_text || "🔒 Запереть"}\` / \`${config.btn_unlock_text || "🔓 Отпереть"}\`\n` +
                `- Кнопка «Скрыть»: \`${config.btn_hide_text || "👻 Скрыть"}\` / \`${config.btn_show_text || "👁️ Показать"}\`\n` +
                `- Кнопка «Лимит»: \`${config.btn_limit_text || "👥 Лимит"}\`\n` +
                `- Кнопка «Имя»: \`${config.btn_name_text || "✏️ Имя"}\`\n\n` +
                "**Дополнительные функции:**\n" +
                `- Функция "Поднять в списке": ${config.allow_bump !== 0 ? "🟢 Включена (Кнопка видима)" : "🔴 Выключена (Кнопка скрыта)"}`
            )
            .setFooter({ text: "OpenVoice • Меню конфигурации" })

        const menu = new StringSelectMenuBuilder()
            .setCustomId("settings_select_param")
            .setPlaceholder("Выберите параметр для изменения...")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("Изменить текст кнопок")
                    .setDescription("Кастомизация названий кнопок в панели управления комнатой")
                    .setValue("edit_buttons_text")
                    .setEmoji("📝"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Переключить 'Поднять в списке'")
                    .setDescription("Включить или скрыть кнопку продвижения комнаты")
                    .setValue("toggle_bump_feature")
                    .setEmoji("🚀")
            )

        const menuRow = new ActionRowBuilder().addComponents(menu)


        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("settings_close_panel")
                .setLabel("Закрыть панель")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("❌")
        )


        await interaction.reply({
            embeds: [settingsEmbed],
            components: [menuRow, buttonRow],
            ephemeral: true
        })
    }
}
