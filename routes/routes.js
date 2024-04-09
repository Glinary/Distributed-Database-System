import { Router } from "express";
import controller from "../controllers/controller.js";

const router = Router();

router.get("/", controller.getHome);
router.post("/alldata", controller.getAllData);
router.get("/doctors", controller.getHome);
router.get("/clinics", controller.getHome);
router.get("/patients", controller.getHome);

export default router;
