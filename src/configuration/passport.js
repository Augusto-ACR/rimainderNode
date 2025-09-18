import { Strategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import { envs } from '../envs.js';
import AppDatasource from '../module/user/providers/datasource.provider.js'

const repo = AppDatasource.getRepository('User');

const JWT_SECRET= envs.JWT_SECRET;

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
};

passport.use(new Strategy(opts, async (jwtPayload, done) => {
    try {
        const user = await repo.findOneBy({ id: jwtPayload.id });
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
    } catch (error) {
        return done(error, false);
    }
}));

export default passport;
