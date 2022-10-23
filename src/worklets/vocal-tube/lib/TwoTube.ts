import { Complex } from "complex.js";

import { npzeros } from "./np";

/**
 * Two Tube Model, A python Class to calculate frequecny response and procee reflection transmission of resonance tube
 */
export class TwoTube {
  /**
   * delay time in 1st tube
   */
  tu1: number;

  /**
   * delay time in 2nd tube
   */
  tu2: number;

  /**
   * reflection coefficient between 1st tube and 2nd tube
   */
  r1: number;

  // initalize Tube length and Tube area
  constructor(
    /**
     * set list of 1st tube's length by unit is [cm]
     */
    public L1: number,
    /**
     * set list of 2nd tube's length by unit is [cm]
     */
    public L2: number,
    /**
     * set list of 1st tube's area by unit is [cm^2]
     */
    public A1: number,
    /**
     * set list of 2nd tube's area by unit is [cm^2]
     */
    public A2: number,
    /**
     * rg is reflection coefficient between glottis and 1st tube
     */
    public rg0 = 0.95,
    /**
     * reflection coefficient between 2nd tube and mouth
     */
    public rl0 = 0.9,
    /**
     * sampling rate
     */
    public sr = 48000
  ) {
    var C0 = 35000.0;
    this.tu1 = this.L1 / C0;
    this.tu2 = this.L2 / C0;
    this.r1 = (this.A2 - this.A1) / (this.A2 + this.A1);
  }

  /**
   * calculate one point of frequecny response
   */
  fone(xw: number): number {
    var yi = new Complex(0, -(this.tu1 + this.tu2) * xw)
      .exp()
      .mul(new Complex(0.5 * (1.0 + this.rg0) * (1.0 + this.r1) * (1.0 + this.rl0), 0));

    var yb = new Complex(0, -2 * this.tu1 * xw)
      .exp()
      .mul(new Complex(this.r1 * this.rg0, 0))
      .add(new Complex(0, -2 * this.tu2 * xw).exp().mul(new Complex(this.r1 * this.rl0, 0)))
      .add(new Complex(0, (this.tu1 + this.tu2) * xw).exp().mul(new Complex(this.rl0 * this.rg0, 0)))
      .add(new Complex(1, 0));

    var val = yi.div(yb);
    return Math.sqrt(Math.pow(val.re, 2) + Math.pow(val.im, 2));
  }

  H0(freq_low = 100, freq_high = 5000, Band_num = 256) {
    var bands = npzeros(Band_num + 1);
    var delta1 = Math.pow(freq_high / freq_low, 1.0 / Band_num);
    bands[0] = freq_low;

    for (var i = 1; i < Band_num + 1; i += 1) {
      bands[i] = bands[i - 1] * delta1;
    }

    var amp = bands.map(f => this.fone(f * 2.0 * Math.PI)).map(v => Math.log10(v) * 20);

    return {
      amp,
      bands,
    };
  }

  process(yg: number[]): number[] {
    var y2tm, ya1, ya2, yb1, yb2;
    var M1 = Math.round(this.tu1 * this.sr) + 1;
    var M2 = Math.round(this.tu2 * this.sr) + 1;

    ya1 = npzeros(M1);
    ya2 = npzeros(M1);
    yb1 = npzeros(M2);
    yb2 = npzeros(M2);
    y2tm = npzeros(yg.length);

    for (var tc0 = 0, _pj_a = yg.length; tc0 < _pj_a; tc0 += 1) {
      for (var i = M1 - 1, _pj_b = 0; i < _pj_b; i += -1) {
        ya1[i] = ya1[i - 1];
        ya2[i] = ya2[i - 1];
      }

      for (i = M2 - 1, _pj_b = 0; i < _pj_b; i += -1) {
        yb1[i] = yb1[i - 1];
        yb2[i] = yb2[i - 1];
      }

      ya1[0] = ((1.0 + this.rg0) / 2.0) * yg[tc0] + this.rg0 * ya2.slice(-1)[0];
      ya2[0] = -1.0 * this.r1 * ya1.slice(-1)[0] + (1.0 - this.r1) * yb2.slice(-1)[0];
      yb1[0] = (1 + this.r1) * ya1.slice(-1)[0] + this.r1 * yb2.slice(-1)[0];
      yb2[0] = -1.0 * this.rl0 * yb1.slice(-1)[0];
      y2tm[tc0] = (1 + this.rl0) * yb1.slice(-1)[0];
    }

    return y2tm;
  }
}
