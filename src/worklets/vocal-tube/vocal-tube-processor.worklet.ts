import StoppableAudioWorkletProcessor from "../StoppableAudioWorkletProcessor";
import { GlottalGenerator } from "./lib/GlottalGenerator";
import { TwoTube } from "./lib/TwoTube";

class VocalTubeProcessor extends StoppableAudioWorkletProcessor {
  glottalGenerator = new GlottalGenerator();
  twoTube = new TwoTube(9.0, 8.0, 1.0, 7.0);

  constructor(options?: AudioWorkletNodeOptions) {
    super();
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const output = outputs[0];

    const { amp: yg } = this.glottalGenerator.H0();
    const amp = this.twoTube.process(yg);

    for (let channel = 0; channel < output.length; ++channel) {
      const samples = output[channel];
      const sampleFrames = samples.length;

      for (let i = 0; i < sampleFrames; i++) {
        samples[i] = amp[i % amp.length];
      }
    }

    return this.running;
  }
}

registerProcessor("vocal-tube-processor", VocalTubeProcessor);

// Fixes TypeScript error TS1208:
// File cannot be compiled under '--isolatedModules' because it is considered a global script file.
export {};
