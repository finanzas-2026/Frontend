import { Rate } from '@shared/index';

export class NormalizedRates {
  readonly tea: Rate;
  readonly ted: Rate;
  readonly tep30: Rate;

  constructor(tea: Rate, ted: Rate, tep30: Rate) {
    this.tea = tea;
    this.ted = ted;
    this.tep30 = tep30;
  }
}
