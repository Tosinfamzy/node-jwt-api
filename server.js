require("dotenv").config();

const express = require("express");

const app = express();
const port = 3000;
const mongoose = require("mongoose");

app.use(express.json());

const authRoutes = require("./routes/auth");

app.use("/api/auth", authRoutes);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nvrkl.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    app.listen(port, () => {
      console.log(`app listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log("Mongoose disconnected on app termination");
    process.exit(0);
  });
});
