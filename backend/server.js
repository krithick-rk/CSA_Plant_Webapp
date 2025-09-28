import express from "express";
import identifyRoute from "./routes/identify.js";

const app = express();
app.use(express.json({ limit: "10mb" })); // handle base64 images

app.use("/identify", identifyRoute);

app.listen(5000, () => console.log("Server running on port 5000"));
