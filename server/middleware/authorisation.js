function authorize(req, res, next) {
    if (typeof req.session.userId !== 'number' || req.session.userId < 0)
        return res.status(401).json({
            message: 'Error: User does not have pemission to access the requested resource.',
        });
    return next();
}
export default authorize;
