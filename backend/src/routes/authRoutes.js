import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authenticateUser from '../middleware/auth.js';
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
  changeMyPassword,
  requestEmailVerification,
  confirmEmailVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
//  Rate limiters
//  Numbers per Phase 11.1/11.2:
//    login                5/min/IP
//    register             3/hour/IP
//    refresh              30/min/IP   (legit clients call it on every expiry)
//    verify-email/send    5/hour/user-via-IP
//    forgot-password      5/hour/IP   (most aggressive — abuse vector)
//    reset-password       10/hour/IP  (token is single-use anyway)
//    verify-email/confirm 20/hour/IP
// ────────────────────────────────────────────────────────────────────────────

const limiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: message ? { success: false, message } : undefined,
    // Skip rate limiting in the integration test suite so tests can hit
    // /register and /login dozens of times without hitting the per-hour cap.
    skip: () => process.env.NODE_ENV === 'test',
  });

const loginLimiter         = limiter(60 * 1000,        5,  'Too many login attempts, please try again shortly.');
const registerLimiter      = limiter(60 * 60 * 1000,   3,  'Too many registration attempts, please try again later.');
const refreshLimiter       = limiter(60 * 1000,       30);
const verifySendLimiter    = limiter(60 * 60 * 1000,   5,  'Too many verification emails sent, please wait before requesting another.');
const verifyConfirmLimiter = limiter(60 * 60 * 1000,  20);
const forgotLimiter        = limiter(60 * 60 * 1000,   5,  'Too many reset requests, please try again later.');
const resetLimiter         = limiter(60 * 60 * 1000,  10);
// Self-service password changes are gated behind the user's current
// password, but we still cap the rate to slow down credential-stuffing
// attempts against a stolen access token.
const changePasswordLimiter = limiter(60 * 60 * 1000,  10, 'Too many password changes, please try again later.');

router.post('/register', registerLimiter, register);
router.post('/login',    loginLimiter,    login);
router.post('/refresh',  refreshLimiter,  refresh);
router.post('/logout',   authenticateUser, logout);
router.get  ('/me',      authenticateUser, me);
router.patch('/me',      authenticateUser, updateMe);
router.post ('/me/password', changePasswordLimiter, authenticateUser, changeMyPassword);

// Email verification
router.post('/verify-email/send',    verifySendLimiter,    authenticateUser, requestEmailVerification);
router.post('/verify-email/confirm', verifyConfirmLimiter, confirmEmailVerification);

// Password reset
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password',  resetLimiter,  resetPassword);

export default router;
