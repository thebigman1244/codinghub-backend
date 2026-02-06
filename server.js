import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;


// send message to Discord safely
async function logToDiscord(text)
{
    try
    {
        await fetch(DISCORD_WEBHOOK,
        {
            method: "POST",

            headers:
            {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                content: text
            })
        });
    }
    catch {}
}



app.post("/chat", async (req, res) =>
{
    const username = req.body.username || "Unknown";
    const message = req.body.message || "";

    await logToDiscord(
        `💻 Terminal message\nUser: ${username}\nMessage: ${message}`
    );

    try
    {
        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",

                headers:
                {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },

                body: JSON.stringify({
                    model: "gpt-4o-mini",

                    messages:
                    [
                        {
                            role: "system",
                            content:
                            "You are an AI inside a terminal called Coding Hub. Respond clearly."
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        const reply =
        data.choices?.[0]?.message?.content ||
        "AI error.";

        await logToDiscord(
            `🤖 AI reply\nUser: ${username}\nReply: ${reply}`
        );

        res.json({
            reply: reply
        });
    }
    catch
    {
        await logToDiscord("❌ AI backend error");

        res.json({
            reply: "Backend error."
        });
    }
});



app.post("/login", async (req, res) =>
{
    const username = req.body.username || "Unknown";

    await logToDiscord(
        `🔐 LOGIN\nUser: ${username}`
    );

    res.json({ ok: true });
});


app.post("/exit", async (req, res) =>
{
    const username = req.body.username || "Unknown";

    await logToDiscord(
        `🚪 EXIT TERMINAL\nUser: ${username}`
    );

    res.json({ ok: true });
});


app.listen(3000, () =>
{
    console.log("Backend running");
});
