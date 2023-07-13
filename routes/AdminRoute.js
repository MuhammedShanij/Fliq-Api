import express from 'express';
import { loginAdmin , getAllUsers ,blockManagement,blockPost, getAllPosts, getAllReportedPost, getAllSearchUsers} from '../controllers/AdminController.js';
import authMiddleWare from '../middleware/AdminMiddleware.js';

const router = express.Router()

router.post('/login', loginAdmin);
router.get('/users',authMiddleWare, getAllUsers);
router.get('/searchUsers',authMiddleWare, getAllSearchUsers);
router.put('/users/block',authMiddleWare,blockManagement);
router.get('/posts',authMiddleWare, getAllPosts);
router.get('/postsReport', getAllReportedPost);
router.patch('/:id', blockPost);

// router.put('/postsReport/report', reportPost);

export default router