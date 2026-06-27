import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { authMiddleware } from "../middlewares/auth.js";

dotenv.config();

const router = express.Router();

// ✅ REGISTER
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (password.length < 6) {
            return res.status(400).json({ message: "Password too short", type: "error" });
        }

        const exist = await UserModel.findOne({ email })

        if (exist) {
            return res.json({ message: "User exists!", type: "error" })
        }
        const hashpassword = await bcrypt.hash(password, 10)

        await UserModel.create(
            {
                name,
                email,
                password: hashpassword,
                role,
                status: false
            }
        )
        res.status(201).json({ message: "Registered", type: "success" });

    } catch (error) {
        console.log(error)
    }
})

// ✅ LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email })

        if (!user) {
            return res.json({ message: "User doesn't exist!", type: "error" })
        }

        const status = await bcrypt.compare(password, user.password)

        if (!status) {
            return res.json({ message: "Invalid credentials!", type: "error" })
        }

        const accessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        )
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESHSECRET,
            { expiresIn: "7d" }
        );
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        res.json({
            accessToken,
            message: "Welcome back!",
            type: "success",
        });
    } catch (error) {
        console.log(error)
    }
})
// ✅ GET-USER

router.get("/user", authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const user = await UserModel.findById(req.user.id).select("-password");

        res.json(user);
    } catch (error) {
        console.log(error)
    }
});
// // ✅ REFRESH
router.post("/refresh", (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({ message: "No refresh token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESHSECRET);

        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ accessToken });

    } catch (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }
});

// ✅ LOGOUT
router.post("/logout", (req, res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });
    res.json({ message: "Logged out" });
});

export default router;
