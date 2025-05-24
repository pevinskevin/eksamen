function isAuthenticated(req, res, next) {
    if (typeof req.session.userId !== 'number' || req.session.userId < 0)
        return res.status(401).json({
            message: 'Authentication required. Please log in',
        });
    req.user = {
        id: req.session.userId,
        role: req.session.role,
    };
    return next();
}
export default isAuthenticated;
