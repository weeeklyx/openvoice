require("dotenv").config()
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require("discord.js")
const { initDatabase } = require("./src/database/dbManager")
const config = require("./config.json")
const fs = require("fs")
const path = require("path")

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
})

client.commands = new Collection()

async function loadCommands() {
    const commandsArray = []
    const commandsPath = path.join(__dirname, "src/commands")
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true })
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"))
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath)
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command)
            commandsArray.push(command.data.toJSON())
        }
    }

    if (commandsArray.length === 0) return

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)
    try {
        console.log(`Регистрация команд (${commandsArray.length}) в Discord API...`)
        await rest.put(
            Routes.applicationCommands(config.CLIENT_ID),
            { body: commandsArray }
        )
        console.log(`Все команды (${commandsArray.length}) зарегистрированы!`)
    } catch (error) {
        console.error("Ошибка при регистрации команд!", error)
    }
}

async function loadEvents() {
    const eventsPath = path.join(__dirname, "src/events")
    if (!fs.existsSync(eventsPath)) {
        fs.mkdirSync(eventsPath, { recursive: true })
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"))
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file)
        const event = require(filePath)
        if ("name" in event && "execute" in event) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args))
            } else {
                client.on(event.name, (...args) => event.execute(...args))
            }
        }
    }
}

async function start() {
    try {
        await initDatabase()
        await loadCommands()
        await loadEvents()
        if (!process.env.TOKEN) {
            throw new Error("Токен бота не найден в .env")
        }
        await client.login(process.env.TOKEN)
    } catch (error) {
        console.error("Ошибка при запуске бота:", error)
        process.exit(1)
    }
}

client.once("clientReady", () => {
    console.log("OpenVoice запущен!")
})

client.on("interactionCreate", async interaction => {
    if (interaction.isChannelSelectMenu()) {
        const command = client.commands.get("setup")
        if (command && command.handleSelect) {
            return await command.handleSelect(interaction)
        }
    }

    if (interaction.customId && interaction.customId.startsWith("setup_")) {
        const command = client.commands.get("setup")
        if (!command) return

        if (interaction.isButton() && command.handleButton) {
            return await command.handleButton(interaction)
        }
        if (interaction.isStringSelectMenu() && command.handleSelect) {
            return await command.handleSelect(interaction)
        }
        if (interaction.isModalSubmit() && command.handleModal) {
            return await command.handleModal(interaction)
        }
    }

    if (!interaction.isChatInputCommand()) return

    const command = client.commands.get(interaction.commandName)
    if (!command) return

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(`Ошибка при выполнении команды ${interaction.commandName}`, error)
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: "Произошла ошибка внутри команды!", ephemeral: true })
        } else {
            await interaction.reply({ content: "Произошла ошибка внутри команды!", ephemeral: true })
        }
    }
})

start()
