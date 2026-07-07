const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const routes = require("./routes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("NTMS Backend Running");
});

app.use("/api", routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
