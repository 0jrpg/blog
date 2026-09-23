declare module "webpack-obfuscator" {
  export default class WebpackObfuscator {
    constructor(options?: Record<string, unknown>, excludes?: string[]);
  }
}
