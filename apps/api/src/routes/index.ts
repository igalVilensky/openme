import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { authRouter } from "../modules/auth/auth.routes";
import { dashboardProfileRouter } from "../modules/dashboard-profile/dashboard-profile.routes";
import { healthRouter } from "../modules/health/health.routes";
import { inboxRouter } from "../modules/inbox/inbox.routes";
import { publicProfileRouter } from "../modules/public-profile/public-profile.routes";
import { publicSubmissionRouter } from "../modules/public-submission/public-submission.routes";

export const apiRouter: ExpressRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(dashboardProfileRouter);
apiRouter.use(publicProfileRouter);
apiRouter.use(publicSubmissionRouter);
apiRouter.use(inboxRouter);
