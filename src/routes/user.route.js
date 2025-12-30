import { Router } from "express";   
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);

console.log("✅ userRouter loaded");


export default router;