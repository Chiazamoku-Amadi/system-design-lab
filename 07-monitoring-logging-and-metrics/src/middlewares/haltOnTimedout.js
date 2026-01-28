export const haltOnTimedout = (req, res, next) => {
  if (!req.timedout) {
    next();
  }
};
