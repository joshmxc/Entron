import { Router } from "express";
import authRouter from "./auth";
import usersRouter from "./users";
import eventsRouter from "./events";
import guestsRouter from "./guests";
import scansRouter from "./scans";
import invitationsRouter from "./invitations";
import paymentsRouter from "./payments";
import dashboardRouter from "./dashboard";
import healthRouter from "./health";
import messagesRouter from "./messages";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/events", eventsRouter);
router.use("/events/:eventId/guests", guestsRouter);
router.use("/events/:eventId/invitations", invitationsRouter);
router.use("/events/:eventId/messages", messagesRouter);
router.use("/scans", scansRouter);
router.use("/payments", paymentsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/health", healthRouter);

export default router;
