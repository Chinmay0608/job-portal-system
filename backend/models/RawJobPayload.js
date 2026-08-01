const mongoose = require("mongoose");
const zlib = require("zlib");

const RawJobPayloadSchema = new mongoose.Schema({
  externalId: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  companyId: {
    type: String, // String identifier or ObjectId for the company
    required: true,
  },
  // We store the payload as a compressed Buffer to save massive amounts of MongoDB storage
  payloadCompressed: {
    type: Buffer,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
    // TTL Index: automatically expire documents after 90 days (7,776,000 seconds)
    // The archiving service should process them before this TTL hits.
    expires: '90d',
  },
}, { timestamps: true });

// Compound index for fast upserts
RawJobPayloadSchema.index({ provider: 1, externalId: 1 }, { unique: true });

// Virtual to automatically decompress payload when accessed
RawJobPayloadSchema.virtual('payload').get(function() {
  if (this.payloadCompressed) {
    try {
      const decompressed = zlib.gunzipSync(this.payloadCompressed);
      return JSON.parse(decompressed.toString('utf-8'));
    } catch (e) {
      console.error("[RawJobPayload] Failed to decompress payload:", e);
      return null;
    }
  }
  return null;
});

// Method to compress and set payload
RawJobPayloadSchema.methods.setPayload = function(jsonPayload) {
  const jsonString = JSON.stringify(jsonPayload);
  this.payloadCompressed = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
};

module.exports = mongoose.model("RawJobPayload", RawJobPayloadSchema);
