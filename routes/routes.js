import { Router } from "express";
import controller from "../controllers/controller.js";

const router = Router();

router.get("/", controller.getHome);
router.get("/doctors", controller.getDoctors);

router.post("/editAppointment", controller.editAppointment);
router.post("/deleteAppointment", controller.deleteAppointment);
router.post("/alldata", controller.getAllData);
router.post("/allNewData", controller.getAllNewData);
router.post("/dataCount", controller.getDataCount);
router.post("/postAppointment", controller.postAppointment);
router.post("/searchAppointment", controller.searchAppointment);
router.get("/doctors", controller.getHome);
router.get("/clinics", controller.getHome);
router.get("/patients", controller.getHome);

export default router;
