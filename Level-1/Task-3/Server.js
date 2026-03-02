const express = require("express");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(3000, () => {
    console.log("🚀 Task 3 server running at http://localhost:3000");
});
