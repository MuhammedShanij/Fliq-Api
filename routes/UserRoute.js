import express from 'express'
import { deleteUser, followUser,getBlockStatus, getAllUsers, getAllUsersDynamically, getUser, unfollowUser, updateUser,followersList,followingList, changeUsername } from '../controllers/UserController.js'
import authMiddleWare from '../middleware/AuthMiddleware.js';

const router = express.Router()

router.get('/:id', getUser);
router.get('/:id/block-status', getBlockStatus);
router.get('/',getAllUsers)
router.put('/changeUsername',changeUsername)
router.put('/update',authMiddleWare, updateUser)
router.delete('/:id',authMiddleWare, deleteUser)
router.put('/:id/follow',authMiddleWare, followUser)
router.put('/:id/unfollow',authMiddleWare, unfollowUser)
router.get('/:id/followers',authMiddleWare, followersList)
router.get('/:id/following',authMiddleWare, followingList)

router.get('/users/userslist', getAllUsersDynamically);
export default router