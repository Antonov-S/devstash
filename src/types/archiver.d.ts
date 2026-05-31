// archiver v8 is ESM-only and ships NO type declarations of its own, and the
// DefinitelyTyped `@types/archiver` only describes the legacy v7 function API
// (`archiver("zip", opts)` default export) — it has no `ZipArchive` named
// export. This minimal ambient declaration covers the v8 surface we use:
// `new ZipArchive({ zlib })`, `.append(stream, { name })`, `.finalize()`, and
// the fact that the archive is a Node stream (so `Readable.toWeb(archive)`
// typechecks). Remove this file once `@types/archiver` ships v8 support.
declare module "archiver" {
  import { Transform } from "node:stream";

  export interface ArchiverZlibOptions {
    level?: number;
    memLevel?: number;
    strategy?: number;
  }

  export interface ZipArchiverOptions {
    zlib?: ArchiverZlibOptions;
    comment?: string;
    forceZip64?: boolean;
    store?: boolean;
  }

  export interface EntryData {
    name?: string;
    store?: boolean;
  }

  export class Archiver extends Transform {
    append(
      source: NodeJS.ReadableStream | Buffer | string,
      data?: EntryData
    ): this;
    finalize(): Promise<void>;
    pointer(): number;
    abort(): this;
  }

  export class ZipArchive extends Archiver {
    constructor(options?: ZipArchiverOptions);
  }

  export class TarArchive extends Archiver {
    constructor(options?: ZipArchiverOptions);
  }

  export class JsonArchive extends Archiver {
    constructor(options?: ZipArchiverOptions);
  }
}
