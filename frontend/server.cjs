const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const url = process.env.VITE_API_URL || "http://localhost:5000";

app.use(express.static(path.join(__dirname, "dist")));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on ${PORT}`);
    console.log(`API URL: ${url}`);
});
