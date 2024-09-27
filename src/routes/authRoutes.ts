import { Router } from "express";
import { login, register, resetPassword } from "../controllers/authController";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/reset-password", resetPassword);

export default router;
