import { FileStatus } from './enum';

export class File {
    constructor(basePath, metadata) {
        this.status = FileStatus.IDLE;
        this.hash = metadata.hash;
        this.last_modified = metadata.last_modified;
        this.bytes = metadata.bytes;
        this.path = metadata.name;
        this.filetype = this.getFiletype(this.path);
        this.name = this.getName(this.path);
        this.uniquePath = this.getUniquePath(basePath, this.path);
    }

    getUniquePath(base, name) {
        return name.substring(name.indexOf(base) + base.length);
    }

    getFiletype(name) {
        return name.substring(name.lastIndexOf('.') + 1);
    }

    getName(name) {
        return name.substring(name.lastIndexOf('/') + 1, name.lastIndexOf('.'));
    }

    setStatus(status) {
        this.status = status;
    }
}
