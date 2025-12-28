// Asset module declarations for Vite
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

// Optional peer dependency - types are inlined in controller.ts
declare module 'zeldhash-miner' {
  const content: unknown;
  export = content;
}

