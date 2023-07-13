import express from 'express';
import { googleRegister, loginUser, registerUser } from '../controllers/AuthController.js';

const router = express.Router()


router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/google',googleRegister)

export default router