import express from 'express'
import { createPost, deletePost, getPost, getTimelinePosts,deleteComment, likePost, updatePost,addComment ,reportPost, addCommentReply, deleteCommentReply, updateComment} from '../controllers/PostController.js'
import authMiddleWare from '../middleware/AuthMiddleware.js'
const router = express.Router()

router.post('/',createPost)
router.get('/:id', getPost)
router.put('/updatePost/:id', updatePost)
router.put('/updateComment', updateComment)
router.post('/report',reportPost)
router.delete('/:id', deletePost)
router.put('/:id/like',authMiddleWare, likePost)
router.get('/:id/timeline', getTimelinePosts)
router.post('/addComment',addComment)
router.delete('/deleteComment/:id', deleteComment)
router.post('/addCommentReply',addCommentReply)
router.delete('/deleteCommentReply/:id', deleteCommentReply)



export default router