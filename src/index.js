const config = require('../config.json'),
    credentials = require('../credentials.json');

import { ThumbGenerator } from './generator';
import { Server } from './server';

const generator = new ThumbGenerator(config, credentials);
const server = new Server(config, generator);
