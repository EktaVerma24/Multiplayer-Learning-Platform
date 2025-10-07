import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check if token exists and is in "Bearer <token>" format
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token and get decoded payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and attach to request object (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      // Check if user exists (edge case: user deleted after token issued)
      if (!req.user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      // Proceed to the next middleware/controller
      return next();
      
    } catch (error) {
      console.error(error);
      // 2. Ensure return is used for all 401 responses to stop execution
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // 3. Handle case where token is completely missing from the request header
  //    We only need to check if 'token' is missing IF the 'if' block above didn't find one.
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};