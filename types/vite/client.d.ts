interface ImportMetaEnv {
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "vite/client" {
  export interface ImportMetaEnv extends Record<string, string | boolean | undefined> {}
}
