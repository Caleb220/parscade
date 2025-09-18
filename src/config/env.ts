import { buildEnv } from '../schemas';

const rawEnv = import.meta.env ?? {};

export const env = Object.freeze(buildEnv(rawEnv));
