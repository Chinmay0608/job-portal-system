export async function startMicrophoneAudioCapture(onAudioChunk) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone capture is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("Audio processing is not supported in this browser.");
  }

  const context = new AudioContextClass();
  try {
    await context.resume();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const silentGain = context.createGain();
    processor.onaudioprocess = (event) => {
      onAudioChunk?.(event.inputBuffer.getChannelData(0));
      event.outputBuffer.getChannelData(0).fill(0);
    };
    silentGain.gain.value = 0;
    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(context.destination);

    return {
      sampleRate: context.sampleRate,
      async stop() {
        processor.onaudioprocess = null;
        source.disconnect();
        processor.disconnect();
        silentGain.disconnect();
        stream.getTracks().forEach((track) => track.stop());
        await context.close();
      },
    };
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    await context.close();
    throw error;
  }
}
