const courseAccess = require('./courseAccess');
module.exports = (model, param = 'id') => async (req, res, next) => {
  try {
    const resource = await require(`../models/${model}`).findById(req.params[param] || req.body.assignmentId);
    if (!resource) return res.status(404).json({
      message: `${model} not found`
    });
    req.resource = resource;
    req.params.courseId = String(resource.course);
    return courseAccess(req, res, next);
  } catch (e) {
    return res.status(400).json({
      message: 'Invalid resource reference'
    });
  }
};
