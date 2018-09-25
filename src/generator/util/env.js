import { Env as EnvEnum } from '../enum/env';

const currentEnv = EnvEnum.value(process.env.NODE_ENV);

export class Env {
    static isDevelopment() {
        return currentEnv === EnvEnum.development;
    }

    static isProduction() {
        return currentEnv === EnvEnum.production;
    }

    static get() {
        return currentEnv;
    }
}
