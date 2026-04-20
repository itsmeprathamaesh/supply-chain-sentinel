import { Router, type IRouter } from "express";
import healthRouter from "./health";
import suppliersRouter from "./suppliers";
import ordersRouter from "./orders";
import deliveriesRouter from "./deliveries";
import forecastRouter from "./forecast";
import alertsRouter from "./alerts";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(suppliersRouter);
router.use(ordersRouter);
router.use(deliveriesRouter);
router.use(forecastRouter);
router.use(alertsRouter);
router.use(uploadRouter);

export default router;
