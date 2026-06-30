const { ChannelType, PermissionFlagsBits } = require("discord.js")
const { getGuildSettings, createActiveRoom, deleteActiveRoom, db } = require("../database/dbManager")
const { generateVoicePanel } = require("../templates/panelEmbed")

module.exports = {

    name: "voiceStateUpdate",

    async execute(oldState, newState) {

        const member = newState.member
        if (!member || member.user.bot) return

        const settings = await getGuildSettings(newState.guild.id)
        if (!settings || !settings.master_channel_id) return

        const MASTER_CHANNEL_ID = settings.master_channel_id



        if (newState.channelId === MASTER_CHANNEL_ID) {

            try {

                const masterChannel = newState.channel
                if (!masterChannel) return

                const roomTemplateName = settings.default_room_name || "🎤 Комната {user}"
                const roomLimit = settings.default_limit || 0
                const finalRoomName = roomTemplateName.replace("{user}", member.displayName)

                const userPreset = await db().get("SELECT * FROM user_settings WHERE user_id = ?", [member.id])


                const targetName = userPreset ? (userPreset.room_name || finalRoomName) : finalRoomName
                const targetLimit = userPreset ? userPreset.user_limit : roomLimit
                const targetLocked = userPreset ? userPreset.is_locked : 0
                const targetHidden = userPreset ? userPreset.is_hidden : 0


                const permissionOverwrites = [
                    {
                        id: member.id,
                        allow: [PermissionFlagsBits.ManageChannels]
                    }
                ]


                if (targetLocked === 1) {
                    permissionOverwrites.push({
                        id: newState.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.Connect] 
                    })
                }


                if (targetHidden === 1) {
                    permissionOverwrites.push({
                        id: newState.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel] 
                    })
                }


                const customChannel = await newState.guild.channels.create({
                    
                    name: targetName,
                    type: ChannelType.GuildVoice,
                    parent: masterChannel.parentId,
                    userLimit: targetLimit,
                    permissionOverwrites: permissionOverwrites

                })


                await member.voice.setChannel(customChannel)


                const roomData = {
                    is_locked: targetLocked,
                    is_hidden: targetHidden,
                    user_limit: targetLimit
                }

                const panelData = generateVoicePanel(member.id, roomData, settings)


                const panelMessage = await customChannel.send({
                    content: `👋 <@${member.id}>, твоя приватная комната успешно создана! Используй панель ниже для управления:`,
                    embeds: panelData.embeds,
                    components: panelData.components
                })

                await createActiveRoom(
                    customChannel.id, 
                    member.id, 
                    panelMessage.id, 
                    targetLocked, 
                    targetHidden, 
                    targetLimit
                )

            } catch (error) {

                console.error("Ошибка при создании приватной комнаты:", error)

            }

        }


        if (oldState.channelId && oldState.channelId !== newState.channelId) {

            const oldChannel = oldState.channel
            if (!oldChannel) return


            const roomSession = await db().get("SELECT * FROM active_rooms WHERE channel_id = ?", [oldChannel.id])
            

            if (roomSession) {


                if (oldChannel.members.size === 0) {

                    try {


                        await oldChannel.delete()
                        

                        await deleteActiveRoom(oldChannel.id)

                    } catch (error) {

                        console.error("Ошибка при удалении пустой комнаты:", error)

                    }

                }

            }

        }

    }

}
