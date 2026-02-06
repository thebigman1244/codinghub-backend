import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

const PASSWORD = "dinh113";

const sessions = new Set();

function generateToken()
{
    return Math.random().toString(36).substring(2)
         + Math.random().toString(36).substring(2);
}

async function log(text)
{
    try
    {
        await fetch(DISCORD_WEBHOOK,
        {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({content:text})
        });
    }
    catch {}
}


// LOGIN
app.post("/auth",(req,res)=>
{
    const username = req.body.username;
    const password = req.body.password;

    if(password === PASSWORD)
    {
        const token = generateToken();

        sessions.add(token);

        log(`🔐 LOGIN: ${username}`);

        res.json({
            success:true,
            token:token
        });
    }
    else
    {
        res.json({success:false});
    }
});


// VERIFY
app.post("/verify",(req,res)=>
{
    const token = req.body.token;

    res.json({
        valid:sessions.has(token)
    });
});


// CHAT
app.post("/chat", async (req,res)=>
{
    const token = req.body.token;

    if(!sessions.has(token))
    {
        res.json({reply:"Unauthorized"});
        return;
    }

    const username = req.body.username;
    const message = req.body.message;

    log(`💻 ${username}: ${message}`);

    const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
            method:"POST",
            headers:
            {
                "Content-Type":"application/json",
                "Authorization":`Bearer ${OPENAI_API_KEY}`
            },
            body:JSON.stringify({
                model:"gpt-4o-mini",
                messages:[
                    {role:"user",content:message}
                ]
            })
        }
    );

    const data = await response.json();

    const reply =
    data.choices?.[0]?.message?.content || "Error";

    log(`🤖 AI: ${reply}`);

    res.json({reply});
});


app.listen(3000,()=>{
    console.log("Secure backend running");
});
