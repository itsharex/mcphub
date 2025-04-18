import express from 'express';
import { check } from 'express-validator';
import path from 'path';
import {
  getAllServers,
  getAllSettings,
  createServer,
  updateServer,
  deleteServer,
  toggleServer,
} from '../controllers/serverController.js';
import {
  getGroups,
  getGroup,
  createNewGroup,
  updateExistingGroup,
  deleteExistingGroup,
  addServerToExistingGroup,
  removeServerFromExistingGroup,
  getGroupServers,
  updateGroupServersBatch
} from '../controllers/groupController.js';
import {
  login,
  register,
  getCurrentUser,
  changePassword
} from '../controllers/authController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

export const initRoutes = (app: express.Application): void => {
  // API routes protected by auth middleware in middlewares/index.ts
  router.get('/servers', getAllServers);
  router.get('/settings', getAllSettings);
  router.post('/servers', createServer);
  router.put('/servers/:name', updateServer);
  router.delete('/servers/:name', deleteServer);
  router.post('/servers/:name/toggle', toggleServer);
  
  // Group management routes
  router.get('/groups', getGroups);
  router.get('/groups/:id', getGroup);
  router.post('/groups', createNewGroup);
  router.put('/groups/:id', updateExistingGroup);
  router.delete('/groups/:id', deleteExistingGroup);
  router.post('/groups/:id/servers', addServerToExistingGroup);
  router.delete('/groups/:id/servers/:serverName', removeServerFromExistingGroup);
  router.get('/groups/:id/servers', getGroupServers);
  // New route for batch updating servers in a group
  router.put('/groups/:id/servers/batch', updateGroupServersBatch);
  
  // Auth routes (these will NOT be protected by auth middleware)
  app.post('/auth/login', [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty(),
  ], login);
  
  app.post('/auth/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ], register);
  
  app.get('/auth/user', auth, getCurrentUser);
  
  // Add change password route
  app.post('/auth/change-password', [
    auth,
    check('currentPassword', 'Current password is required').not().isEmpty(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 }),
  ], changePassword);

  app.use('/api', router);

  app.get('*', (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend', 'dist', 'index.html'));
  });
};

export default router;
