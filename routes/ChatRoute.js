import express from 'express'
import { createChat, findChat, getFollowers, userChats } from '../controllers/ChatController.js';
import authMiddleWare from '../middleware/AuthMiddleware.js'

const router = express.Router()

router.post('/',authMiddleWare, createChat);
router.get('/:userId',authMiddleWare, userChats);
router.get('/find/:firstId/:secondId',authMiddleWare, findChat);
router.get('/getFollowers/:userId',authMiddleWare,getFollowers)

export default router