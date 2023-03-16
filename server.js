const express = require("express");

const connectDB = require("./config/db");

const config = require("config");

const configPORT = config.get("PORT");

const app = express();
connectDB();
app.get("/", (req, res) => {
  res.send("API Running");
});

app.use(express.json({ extended: false }));
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/recipes", require("./routes/api/recipes"));

const PORT = configPORT || 1000;

app.listen(PORT, () => {
  console.log(`Server listening on Port ${PORT}`);
});
