import { Router } from "express";
import userRoutes from "./users.js";
import productRoutes from "./products.js";

const router = Router();

// User routes
router.use("/user", userRoutes);

// Product routes
router.use("/product", productRoutes);

export default router;