import { RequestHandler } from 'express';

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(403).send({
      success: false,
      message: 'You must be logged in in order to perform the requested action.'
    });
  }

  next();
};
