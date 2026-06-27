import express from "express";
import UserModel from "../models/User.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// GET ALL USERS (ADMIN)
router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await UserModel.find().select("-password");
  res.json({
    message: "Users fetched successfully",
    type: "success",
    data: users
  });
});

// DELETE USER
router.delete("/admin/deleteUser/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await UserModel.findByIdAndDelete(req.params.id);
  res.json(req.params.id);
});

router.put("/admin/changeStatus/:id", authMiddleware, adminMiddleware, async (req, res) => {

  await UserModel.findByIdAndUpdate(req.params.id, req.body);

  res.json({
    message: "User updated successfully",
    type: "success",
    id: req.params.id
  });
});
export default router;