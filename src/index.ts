import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";

const app = express();
const PORT = 3031;

app.use(express.json());
app.use(cors());

// app.use("/api/movies", movieRoutes);
// app.use("/api/actors", actorRoutes);
// app.use("/api/directors", directorRoutes);
// app.use("/api/genres", genreRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
