import cors from "cors";
import express from "express";
import config from "./config/index.js";
import { pool, checkConnection } from "./config/db.js";
import authRoutes from "./routes/userRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
const app = express();
const PORT = config.server.port;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello from backend");
});
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await checkConnection();
});
