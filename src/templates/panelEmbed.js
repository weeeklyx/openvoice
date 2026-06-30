
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

function generateVoicePanel(ownerId, roomData = {}, serverConfig = {}) {

    const isLocked = roomData.is_locked === 1
    const isHidden = roomData.is_hidden === 1
    const limit = roomData.user_limit ?? 0


    const isBumpAllowed = serverConfig.allow_bump !== 0 

    const embed = new EmbedBuilder()
        .setTitle("Управление комнатой 👑")
        .setColor("#ebc334")
        .setDescription(
            `Добро пожаловать в твою приватную комнату!\n\n` +
            `Текущий владелец: <@${ownerId}>\n\n` +
            `**Статус комнаты:** \n\n` +
            `- **Доступ:** ${isLocked ? "🔒 **Заперта (Только для гостей)**" : "🔓 **Открыта для всех**"}\n` +
            `- **Видимость:** ${isHidden ? "👻 **Скрыта из списка**" : "👁️ **Видима для всех**"}\n` +
            `- **Лимит мест:** \`${limit === 0 ? "Без лимита" : limit + " участников"}\`\n\n` +

            `**Поднятие в списке:** ${isBumpAllowed ? "✅ Доступно" : "❌ Отключено администрацией"}`
        )
        .setFooter({ text: "OpenVoice - Панель управления" })


    const lockLabel = isLocked 
        ? (serverConfig.btn_unlock_text || "🔓 Отпереть") 
        : (serverConfig.btn_lock_text || "🔒 Запереть");

    const hideLabel = isHidden 
        ? (serverConfig.btn_show_text || "👁️ Показать") 
        : (serverConfig.btn_hide_text || "👻 Скрыть");

    const limitLabel = serverConfig.btn_limit_text || "👥 Лимит";
    const renameLabel = serverConfig.btn_name_text || "✏️ Имя";
    const bumpLabel = serverConfig.btn_bump_text || "🚀 Поднять в списке";

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voice_lock")
            .setLabel(lockLabel) 
            .setStyle(isLocked ? ButtonStyle.Success : ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId("voice_hide")
            .setLabel(hideLabel) 
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("voice_limit")
            .setLabel(limitLabel) 
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("voice_rename")
            .setLabel(renameLabel) 
            .setStyle(ButtonStyle.Success)
    )

 

    const components = [row1];


    if (isBumpAllowed) {
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("voice_bump")
                .setLabel(bumpLabel)
                .setStyle(ButtonStyle.Success)
        )
        components.push(row2);
    }

    return { embeds: [embed], components: components }    
}

module.exports = { generateVoicePanel }

