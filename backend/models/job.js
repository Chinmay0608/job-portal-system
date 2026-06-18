const jobSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  salary: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },

  skillsRequired: {
    type: [String],
    default: [],
  },

  educationRequired: {
    type: String,
    default: "",
  },

  experienceRequired: {
    type: String,
    enum: ["Fresher", "0-2 Years", "2-5 Years", "5+ Years"],
    default: "Fresher",
  },

  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
},
{
  timestamps: true,
}
);