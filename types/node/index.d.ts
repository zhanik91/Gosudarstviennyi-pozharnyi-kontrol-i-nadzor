declare var process: any;
declare var module: any;
declare var require: any;
declare var __dirname: string;
declare var __filename: string;
declare var global: any;
declare var Buffer: any;

declare module "fs" { const value: any; export = value; }
declare module "path" { const value: any; export = value; }
declare module "http" { const value: any; export = value; }
declare module "https" { const value: any; export = value; }
declare module "crypto" { const value: any; export = value; }
declare module "url" { const value: any; export = value; }
declare module "stream" { const value: any; export = value; }
declare module "events" { const value: any; export = value; }
declare module "os" { const value: any; export = value; }
declare module "zlib" { const value: any; export = value; }
declare module "buffer" { export const Buffer: any; }
declare module "net" { const value: any; export = value; }
declare module "tls" { const value: any; export = value; }
