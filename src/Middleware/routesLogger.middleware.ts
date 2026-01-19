import type { Request, Response, NextFunction } from 'express';

const routerLogger = (req: Request, res: Response, next: NextFunction) => {
    console.log("HTTP Request:", {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
    next();
};

export default routerLogger;