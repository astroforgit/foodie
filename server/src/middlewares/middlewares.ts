import { NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { ErrorHandler } from './error.middleware';
import config from '@/config/config';

function isAuthenticated(req: any, res: any, next: NextFunction) {
    if (req.isAuthenticated()) {
        console.log('CHECK MIDDLEWARE: IS AUTH: ', req.isAuthenticated());
        return next();
    }

    return next(new ErrorHandler(401));
}

function validateObjectID(...ObjectIDs) {
    return function (req: any, res: any, next: NextFunction) {
        ObjectIDs.forEach((id) => {
            const idValue = req.params[id];

            // For PostgreSQL, validate as integer
            if (config.db.type === 'postgres') {
                const intId = parseInt(idValue);
                if (isNaN(intId) || intId <= 0) {
                    return next(new ErrorHandler(400, `ID ${id} supplied is not valid`));
                }
            } else {
                // For MongoDB, validate as ObjectID
                if (!isValidObjectId(idValue)) {
                    return next(new ErrorHandler(400, `ObjectID ${id} supplied is not valid`));
                }
            }
        });
        next();
    }
}

export { isAuthenticated, validateObjectID };

