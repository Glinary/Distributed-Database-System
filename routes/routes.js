import { Router } from "express";
import controller from "../controllers/controller.js";

const router = Router();

router.get("/", controller.getHome);
router.get("/doctors", controller.getDoctors);

export default router;