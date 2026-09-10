/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REACT_MIGRATION_ENABLED?: string;
  readonly VITE_LOCATIONIQ_ACCESS_TOKEN?: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
