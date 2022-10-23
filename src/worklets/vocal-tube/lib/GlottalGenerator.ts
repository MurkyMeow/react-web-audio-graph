import { npzeros } from "./np";

/**
 * glottal voice source as input of Two Tubes Model of vocal tract
 * Glottal Volume Velocity
 * based on A.E.Rosenberg's formula as Glottal Volume Velocity
 */
export class GlottalGenerator {
  public yg: number[];

  public N1: number;
  public N2: number;
  public N3: number;
  public LL: number;

  constructor(
    /**
     * duration time of close state [mSec]
     */
    public tclosed = 5.0,
    /**
     * duration time of opening [mSec]
     */
    public trise = 6.0,
    /**
     * duration time of closing [mSec]
     */
    public tfall = 2.0,
    /**
     * sampling rate
     */
    public sr = 16000
  ) {
    this.N1 = Math.floor((this.tclosed / 1000.0) * this.sr);
    this.N2 = Math.floor((this.trise / 1000.0) * this.sr);
    this.N3 = Math.floor((this.tfall / 1000.0) * this.sr);
    this.LL = this.N1 + this.N2 + this.N3;

    var yg = npzeros(this.LL);

    for (var t0 = 0, _pj_a = this.LL; t0 < _pj_a; t0 += 1) {
      if (t0 < this.N1) {
      } else {
        if (t0 <= this.N2 + this.N1) {
          yg[t0] = 0.5 * (1.0 - Math.cos((Math.PI / this.N2) * (t0 - this.N1)));
        } else {
          yg[t0] = Math.cos((Math.PI / (2.0 * this.N3)) * (t0 - (this.N2 + this.N1)));
        }
      }
    }

    this.yg = yg;
  }

  make_N_repeat(repeat_num = 3): number[] {
    return npzeros(this.yg.length * repeat_num);
  }

  /**
   * calculate one point of frequecny response
   */
  fone(f: number): number {
    var xw = (2.0 * Math.PI * f) / this.sr;
    var yb = 0;

    var yi_real = 0;
    var yi_imag = 0;

    for (var v = 0; v < this.N2 + this.N3; v += 1) {
      // NOTE эта формула правильная? (сравнить с кодом на питоне)
      yi_real += this.yg[this.N1 + v] * Math.cos(xw * v);
      yi_imag += this.yg[this.N1 + v] * Math.sin(xw * v);

      yb += this.yg[this.N1 + v];
    }

    yi_real /= yb;
    yi_imag /= yb;

    return Math.sqrt(yi_real ** 2 + yi_imag ** 2);
  }

  /**
   * get Log scale frequecny response, from freq_low to freq_high, Band_num points
   */
  H0(freq_low = 100, freq_high = 5000, Band_num = 256) {
    var bands = npzeros(Band_num + 1);
    bands[0] = freq_low;

    // Log Scale
    var delta1 = Math.pow(freq_high / freq_low, 1.0 / Band_num);

    // NOTE конечное условие написано правильно? (сравнить с кодом на питоне)
    for (var i = 1; i < Band_num + 1; i += 1) {
      bands[i] = bands[i - 1] * delta1;
    }

    var amp = bands.map(val => this.fone(val)).map(val => Math.log10(val) * 20);

    return {
      amp,
      bands,
    };
  }
}
