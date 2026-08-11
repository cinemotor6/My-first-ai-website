export interface FxRateProvider {
  readonly name: string;
  /** Rate to convert 1 unit of `from` into `to`. */
  getRate(from: string, to: string): Promise<number>;
}
