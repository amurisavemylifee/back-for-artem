import User from "../models/User";
import jwt from "jsonwebtoken";
import { ErrorType } from "src/types/errors";
import { IRequest, IResponse } from "src/types/utils";

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
  req: IRequest<{
    email: string;
    password: string;
    firstName: string;
    username: string;
  }>,
  res: IResponse<{
    accessToken: string;
    refreshToken: string;
  }>
) {
  const { email, password, firstName, username } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        isSuccess: false,
        message: "Пользователь с таким email уже существует",
        errorCode: ErrorType.USER_WITH_THIS_EMAIL_ALREADY_EXISTS,
      });
    }

    const user = new User({ email, password, firstName, username });
    await user.save();

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      isSuccess: true,
      result: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      isSuccess: false,
      message: "Ошибка сервера",
      errorCode: ErrorType.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function login(
  req: IRequest<{ email: string; password: string }>,
  res: IResponse<{
    accessToken: string;
    refreshToken: string;
  }>
) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({
        isSuccess: false,
        message: "Пользователя с таким email не существует",
        errorCode: ErrorType.USER_WITH_THIS_EMAIL_NOT_FOUND,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Неверный пароль" });
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      isSuccess: true,
      result: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Ошибка сервера",
      errorCode: ErrorType.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function refreshAccessToken(
  req: IRequest<{ refreshToken: string }>,
  res: IResponse<{ accessToken: string; refreshToken: string }>
) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(400)
      .json({ isSuccess: false, message: "Токен обновления отсутствует" });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
    };
    const user = await User.findOne({ where: { _id: decoded.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(401)
        .json({ isSuccess: false, message: "Неверный токен обновления" });
    }

    const newAccessToken = createAccessToken(user.id);
    const newRefreshToken = createRefreshToken(user.id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      isSuccess: true,
      result: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(401).json({
      isSuccess: false,
      message: "Неверный или истекший токен обновления",
    });
  }
}

export async function resetPassword(
  req: IRequest<{ email: string }>,
  res: IResponse<{ password: string }>
) {
  function generateNewPassword() {
    const characters =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newPassword = "";
    for (let i = 0; i < 16; i++) {
      newPassword += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return newPassword;
  }

  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({
        isSuccess: false,
        message: "Пользователя с таким email не существует",
        errorCode: ErrorType.USER_WITH_THIS_EMAIL_NOT_FOUND,
      });
    }
    const newPassword = generateNewPassword();
    user.password = newPassword;

    await user.save();

    res.json({ isSuccess: true, result: { password: newPassword } });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Ошибка сервера",
      errorCode: ErrorType.INTERNAL_SERVER_ERROR,
    });
  }
}
