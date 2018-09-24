import { Enum } from '../util/enum';

export const FileStatus = new Enum([
    'IDLE',
    'QUEUED',
    'DOWNLOADING',
    'COMPRESSING',
    'UPLOADING',
    'COMPLETE'
]);
