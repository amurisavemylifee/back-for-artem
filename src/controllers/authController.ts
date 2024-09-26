import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = "TORPEDNU-EMU-EJI";
const JWT_REFRESH_SECRET = "NAXYU-TI-TAK-SRAL";
const JWT_ACCESS_EXPIRES_IN = "15m";
const JWT_REFRESH_EXPIRES_IN = "7d";

function createAccessToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
}

function createRefreshToken(userId: number) {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

export async function register(
  req: Request<unknown, unknown, { email: string; password: string }>,
  res: Response<
    | {
        accessToken: string;
        refreshToken: string;
      }
    | { message: string; error?: unknown }
  >
) {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: "Пользователь с таким email уже существует",
      });
    }

    const user = new User({ email, password });
    await user.save();

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера", error });
  }
}

export async function login(
  req: Request<unknown, unknown, { email: string; password: string }>,
  res: Response<
    | {
        accessToken: string;
        refreshToken: string;
      }
    | { message: string; error?: unknown }
  >
) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Пользователя с таким email не существует" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера", error });
  }
}

export const refreshAccessToken = async (
  req: Request<unknown, unknown, { refreshToken: string }>,
  res: Response<
    { accessToken: string; refreshToken: string } | { message: string }
  >
) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Токен обновления отсутствует" });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
    };
    const user = await User.findOne({ where: { _id: decoded.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Неверный токен обновления" });
    }

    const newAccessToken = createAccessToken(user.id);
    const newRefreshToken = createRefreshToken(user.id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({ message: "Неверный или истекший токен обновления" });
  }
};
