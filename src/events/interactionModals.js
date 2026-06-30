const { getActiveRoom, updateRoomStatus, getGuildSettings, saveGuildSettings } = require("../database/dbManager")
const { generateVoicePanel } = require("../templates/panelEmbed")
const { EmbedBuilder } = require("discord.js")

module.exports = {
    name: 'interactionCreate', 
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return

        const channel = interaction.channel
        const { customId, guildId } = interaction


        if (customId === "settings_buttons_modal") {
            const txtLock = interaction.fields.getTextInputValue("input_lock").trim() || "🔒 Запереть"
            const txtUnlock = interaction.fields.getTextInputValue("input_unlock").trim() || "🔓 Отпереть"
            const txtHide = interaction.fields.getTextInputValue("input_hide").trim() || "👻 Скрыть"
            const txtShow = interaction.fields.getTextInputValue("input_show").trim() || "👁️ Показать"

            try {
                const currentConfig = await getGuildSettings(guildId)
                const masterId = currentConfig ? currentConfig.master_channel_id : null
                const defName = currentConfig ? currentConfig.default_room_name : "🎤 Комната {user}"
                const defLimit = currentConfig ? currentConfig.default_limit : 0
                const allowBump = currentConfig ? currentConfig.allow_bump : 1


                await saveGuildSettings(guildId, masterId, defName, defLimit, txtLock, txtUnlock, txtHide, txtShow, allowBump)

                const successEmbed = new EmbedBuilder()
                    .setTitle("✅ Названия кнопок обновлены!")
                    .setColor("#2ecc71")
                    .setDescription(
                        "Новые шаблоны успешно применились. Теперь во всех новых комнатах кнопки будут подписаны так:\n\n" +
                        `- **Запереть:** \`${txtLock}\` / **Отпереть:** \`${txtUnlock}\`\n` +
                        `- **Скрыть:** \`${txtHide}\` / **Показать:** \`${txtShow}\``
                    )
                    .setFooter({ text: "OpenVoice • Конфигурация сохранена" })

                return await interaction.update({
                    embeds: [successEmbed],
                    components: [] 
                })

            } catch (error) {
                console.error("Ошибка при сохранении настроек кнопок:", error)
                return await interaction.reply({ content: "❌ Не удалось сохранить настройки.", ephemeral: true })
            }
        }

        if (customId === "voice_limit_modal" || customId === "voice_rename_modal") {
            if (!channel) return

            const roomSession = await getActiveRoom(channel.id)
            if (!roomSession) {
                return await interaction.reply({ content: "❌ Эта комната больше не контролируется системой OpenVoice.", ephemeral: true })
            }

            if (roomSession.owner_id !== interaction.user.id) {
                return await interaction.reply({ content: "❌ Ты не являешься владельцем этой приватной комнаты!", ephemeral: true })
            }


            const guildSettings = await getGuildSettings(guildId)


            if (customId === "voice_limit_modal") {
                const inputLimitRaw = interaction.fields.getTextInputValue("voice_input_limit")
                const newLimit = parseInt(inputLimitRaw) || 0

                try {
                    await channel.setUserLimit(newLimit)
                    await updateRoomStatus(channel.id, "user_limit", newLimit)

                    const updatedRoomData = {
                        is_locked: roomSession.is_locked,
                        is_hidden: roomSession.is_hidden,
                        user_limit: newLimit
                    }


                    const panelData = generateVoicePanel(interaction.user.id, updatedRoomData, guildSettings)
                    return await interaction.update({
                        embeds: panelData.embeds,
                        components: panelData.components
                    })
                } catch (error) {
                    console.error("Ошибка при изменении лимита канала:", error)
                    return await interaction.followUp({ 
                        content: "❌ Не удалось изменить параметры канала. Проверьте корректность данных.", 
                        ephemeral: true 
                    })
                }
            }

            if (customId === "voice_rename_modal") {
                const newName = interaction.fields.getTextInputValue("voice_input_name").trim()

                try {
                    await channel.setName(newName)

                    const updatedRoomData = {
                        is_locked: roomSession.is_locked,
                        is_hidden: roomSession.is_hidden,
                        user_limit: roomSession.user_limit
                    }


                    const panelData = generateVoicePanel(interaction.user.id, updatedRoomData, guildSettings)
                    return await interaction.update({
                        embeds: panelData.embeds,
                        components: panelData.components
                    })
                } catch (error) {
                    console.error("Ошибка при изменении имени канала:", error)
                    return await interaction.followUp({ 
                        content: "❌ Не удалось изменить параметры канала. Проверьте корректность данных.", 
                        ephemeral: true 
                    })
                }
            }
        }
    }
}

