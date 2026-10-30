const router=require('express').Router();
const controller=require('../controllers/gradeController');
const {protect,authorize}=require('../middleware/authMiddleware');
const access=require('../middleware/courseAccess');
router.get('/:courseId',protect,authorize('teacher'),access,controller.getCourseGrades);
router.post('/save',protect,authorize('teacher'),access,controller.bulkSaveAssessment);
router.post('/:courseId/publish',protect,authorize('teacher'),access,controller.publish);
router.get('/student/:courseId',protect,authorize('student'),access,controller.getStudentGrades);
module.exports=router;
