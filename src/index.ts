import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import morgan from "morgan";

const app = express();
const PORT = 3031;

app.use(express.json());
app.use(cors());
app.use(
  morgan((_, req) => {
    console.log(req);
    return [req].join(" ");
  })
);

// app.use("/api/movies", movieRoutes);
// app.use("/api/actors", actorRoutes);
// app.use("/api/directors", directorRoutes);
// app.use("/api/genres", genreRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
