const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js")
const { getGuildSettings, saveGuildSettings, updateGuildSetting } = require("../database/dbManager")


module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {

        if (interaction.customId && interaction.customId.startsWith("setup_")) return;

        if (!interaction.isStringSelectMenu()) return

        console.log(`[MENU] Сработал селект меню! ID: ${interaction.customId}, Выбрано: ${interaction.values[0]}`);

        const { customId, guildId } = interaction


        if (customId === "settings_select_param") {
            const selectedValue = interaction.values[0]
            const currentConfig = await getGuildSettings(interaction.guildId)


            if (selectedValue === "edit_buttons_text") {
                const modal = new ModalBuilder()
                    .setCustomId("settings_buttons_modal")
                    .setTitle("Кастомизация кнопок панели");


                const inputLock = new TextInputBuilder()
                    .setCustomId("input_lock")
                    .setLabel("Текст кнопки «Запереть»")
                    .setStyle(TextInputStyle.Short)
                    .setValue(currentConfig?.btn_lock_text || "🔒 Запереть")
                    .setRequired(true)


                const inputUnlock = new TextInputBuilder()
                    .setCustomId("input_unlock")
                    .setLabel("Текст кнопки «Отпереть»")
                    .setStyle(TextInputStyle.Short)
                    .setValue(currentConfig?.btn_unlock_text || "🔓 Отпереть")
                    .setRequired(true)


                const inputHide = new TextInputBuilder()
                    .setCustomId("input_hide")
                    .setLabel("Текст кнопки «Скрыть»")
                    .setStyle(TextInputStyle.Short)
                    .setValue(currentConfig?.btn_hide_text || "👻 Скрыть")
                    .setRequired(true)


                const inputShow = new TextInputBuilder()
                    .setCustomId("input_show")
                    .setLabel("Текст кнопки «Показать»")
                    .setStyle(TextInputStyle.Short)
                    .setValue(currentConfig?.btn_show_text || "👁️ Показать")
                    .setRequired(true)


                modal.addComponents(
                    new ActionRowBuilder().addComponents(inputLock),
                    new ActionRowBuilder().addComponents(inputUnlock),
                    new ActionRowBuilder().addComponents(inputHide),
                    new ActionRowBuilder().addComponents(inputShow)
                )


                return await interaction.showModal(modal)
            }


            if (selectedValue === "toggle_bump_feature") {
                console.log("[BUMP_TEST] Шаг 1: Зашли в условие бампа. Запрашиваем БД...");

                const currentConfig = await getGuildSettings(interaction.guildId)
                console.log("[BUMP_TEST] Шаг 2: Из БД успешно получено:", currentConfig);

                const currentBumpStatus = currentConfig ? currentConfig.allow_bump : 1
                const newBumpStatus = currentBumpStatus === 1 ? 0 : 1

                try {
                    console.log(`[BUMP_TEST] Шаг 3: Пробуем записать статус ${newBumpStatus} в БД...`);
                    await updateGuildSetting(interaction.guildId, "allow_bump", newBumpStatus)
                    console.log("[BUMP_TEST] Шаг 4: Успешно записано! Отправляем ответ в Дискорд...");

                    const toggleEmbed = new EmbedBuilder()
                        .setTitle("🚀 Функция «Поднять в списке» изменена")
                        .setColor(newBumpStatus === 1 ? "#2ecc71" : "#e74c3c")
                        .setDescription(
                            `Вы успешно обновили глобальную конфигурацию сервера.\n\n` +
                            `Статус отображения кнопки в панелях комнат:\n` +
                            `${newBumpStatus === 1 ? "🟢 **Включена** (кнопка отображается у всех)" : "🔴 **Выключена** (кнопка скрыта во всех новых панелях)"}`
                        )
                        .setFooter({ text: "OpenVoice • Конфигурация сохранена" })

                    return await interaction.update({
                        embeds: [toggleEmbed],
                        components: []
                    })

                } catch (error) {
                    console.error("[BUMP_TEST] КРАШ ВНУТРИ CATCH:", error)
                    return await interaction.followUp({
                        content: "❌ Не удалось обновить статус кнопки бампа в базе данных.",
                        ephemeral: true
                    })
                }
            }

        }
    }
}
