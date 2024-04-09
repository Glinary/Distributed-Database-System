import { Router } from "express";
import controller from "../controllers/controller.js";

const router = Router();

router.get("/", controller.getHome);
router.post("/ad", controller.getAllData);
router.get("/doctors", controller.getDoctors);
router.get("/appointments", controller.getAppointments);

router.post("/postAppointment", controller.postAppointment);

export default router;
