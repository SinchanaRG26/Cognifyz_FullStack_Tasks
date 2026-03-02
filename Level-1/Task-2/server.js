const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Temporary storage
let users = [];

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/submit", (req, res) => {

    const { name, email, password, age } = req.body;

    // Server-side validation
    if (!password || password.length < 6) {
        return res.send("❌ Error: Password must be at least 6 characters.");
    }

    if (!age || age < 18) {
        return res.send("❌ Error: Age must be 18 or above.");
    }

    // Store validated data
    users.push({ name, email, age });

    res.send(`
        <h2>✅ Registration Successful!</h2>
        <p>Name: ${name}</p>
        <p>Email: ${email}</p>
        <p>Total Registered Users: ${users.length}</p>
        <br>
        <a href="/">Go Back</a>
    `);
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
