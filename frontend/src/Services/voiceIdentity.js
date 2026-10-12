const MODEL_ID = "Xenova/wavlm-base-plus-sv";
const PROFILE_KEY = "dhruv_voice_profile_v1";
const SAMPLE_RATE = 16000;
const MIN_MATCH_SCORE = 0.85;

let speakerModelPromise;

export function getVoiceProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    return profile?.version === 1 && Array.isArray(profile.embedding)
      ? profile
      : null;
  } catch {
    return null;
  }
}

export function clearVoiceProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function saveVoiceProfile(embeddings) {
  if (embeddings.length < 3 || embeddings.some((item) => item.length === 0)) {
    throw new Error("Record all three voice samples before saving.");
  }

  const size = embeddings[0].length;
  if (embeddings.some((item) => item.length !== size)) {
    throw new Error("Voice samples did not produce matching profiles. Please try again.");
  }

  const average = new Array(size).fill(0);
  for (const embedding of embeddings) {
    embedding.forEach((value, index) => {
      average[index] += value / embeddings.length;
    });
  }

  const magnitude = Math.hypot(...average);
  if (!magnitude) throw new Error("Could not create a voice profile.");

  const profile = {
    version: 1,
    embedding: average.map((value) => value / magnitude),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

async function getSpeakerModel(onProgress) {
  if (!speakerModelPromise) {
    speakerModelPromise = (async () => {
      const { AutoModelForXVector, AutoProcessor } = await import("@huggingface/transformers");
      const [processor, model] = await Promise.all([
        AutoProcessor.from_pretrained(MODEL_ID, { progress_callback: onProgress }),
        AutoModelForXVector.from_pretrained(MODEL_ID, {
          dtype: "q8",
          progress_callback: onProgress,
        }),
      ]);
      return { processor, model };
    })().catch((error) => {
      speakerModelPromise = null;
      throw error;
    });
  }
  return speakerModelPromise;
}

export async function prepareSpeakerModel(onProgress) {
  await getSpeakerModel(onProgress);
}

function resample(audio, inputRate) {
  if (inputRate === SAMPLE_RATE) return audio;
  const outputLength = Math.floor(audio.length * SAMPLE_RATE / inputRate);
  const output = new Float32Array(outputLength);
  const ratio = inputRate / SAMPLE_RATE;

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const left = Math.floor(sourceIndex);
    const fraction = sourceIndex - left;
    output[index] = audio[left] * (1 - fraction) + (audio[left + 1] || 0) * fraction;
  }
  return output;
}

function trimSilence(audio) {
  let peak = 0;
  for (const value of audio) peak = Math.max(peak, Math.abs(value));
  const threshold = Math.max(0.008, peak * 0.06);
  let start = 0;
  let end = audio.length - 1;

  while (start < end && Math.abs(audio[start]) < threshold) start += 1;
  while (end > start && Math.abs(audio[end]) < threshold) end -= 1;

  const padding = SAMPLE_RATE * 0.08;
  start = Math.max(0, start - padding);
  end = Math.min(audio.length - 1, end + padding);
  return audio.slice(start, end + 1);
}

export async function createSpeakerEmbedding(audio, inputRate, onProgress) {
  const normalizedAudio = trimSilence(resample(audio, inputRate));
  if (normalizedAudio.length < SAMPLE_RATE * 0.6) {
    throw new Error("I couldn't hear enough speech. Please say “Hey Dhruv” clearly.");
  }

  const { processor, model } = await getSpeakerModel(onProgress);
  const inputs = await processor(normalizedAudio);
  const { embeddings } = await model(inputs);
  return Array.from(embeddings.data);
}

export function matchesVoiceProfile(embedding, profile) {
  if (!profile?.embedding || profile.embedding.length !== embedding.length) return false;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < embedding.length; index += 1) {
    const left = embedding[index];
    const right = profile.embedding[index];
    dot += left * right;
    leftMagnitude += left * left;
    rightMagnitude += right * right;
  }

  const score = dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
  return score >= MIN_MATCH_SCORE;
}

export async function recordVoiceSample(durationMs = 3000) {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("Voice enrollment is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
  let recorder;
  try {
    recorder = new MediaRecorder(stream);
    const chunks = [];
    const recording = new Promise((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => reject(new Error("Microphone recording failed."));
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
    });

    recorder.start();
    await new Promise((resolve) => setTimeout(resolve, durationMs));
    recorder.stop();
    const blob = await recording;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Audio processing is not supported in this browser.");

    const context = new AudioContextClass();
    try {
      const buffer = await context.decodeAudioData(await blob.arrayBuffer());
      const mono = new Float32Array(buffer.length);
      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const data = buffer.getChannelData(channel);
        for (let index = 0; index < data.length; index += 1) {
          mono[index] += data[index] / buffer.numberOfChannels;
        }
      }
      return { audio: resample(mono, buffer.sampleRate), sampleRate: SAMPLE_RATE };
    } finally {
      await context.close();
    }
  } finally {
    if (recorder?.state === "recording") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  }
}

export async function startSpeakerAudioCapture(seconds = 4) {
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
    const capacity = Math.ceil(context.sampleRate * seconds);
    const ring = new Float32Array(capacity);
    let writeIndex = 0;
    let samplesWritten = 0;

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      for (let index = 0; index < input.length; index += 1) {
        ring[writeIndex] = input[index];
        writeIndex = (writeIndex + 1) % capacity;
      }
      samplesWritten = Math.min(capacity, samplesWritten + input.length);
      event.outputBuffer.getChannelData(0).fill(0);
    };
    silentGain.gain.value = 0;
    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(context.destination);

    return {
      sampleRate: context.sampleRate,
      getRecentAudio(durationSeconds = 3) {
        const length = Math.min(samplesWritten, Math.floor(context.sampleRate * durationSeconds));
        const audio = new Float32Array(length);
        const start = (writeIndex - length + capacity) % capacity;
        for (let index = 0; index < length; index += 1) {
          audio[index] = ring[(start + index) % capacity];
        }
        return audio;
      },
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
