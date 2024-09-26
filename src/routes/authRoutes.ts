import { Router } from "express";
import {
  login,
  refreshAccessToken,
  register,
} from "../controllers/authController";

const router = Router();

router.post("/register", register);

router.post("/login", login);

// router.post("/refresh-token", refreshAccessToken);

export default router;
