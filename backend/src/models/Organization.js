import mongoose from 'mongoose';

export const ORGANIZATION_INDUSTRIES = Object.freeze([
  'clinic',
  'hospital',
  'bank',
  'salon',
  'restaurant',
  'retail',
  'government',
  'other',
]);

export const ORGANIZATION_PLANS = Object.freeze(['starter', 'growth', 'scale']);

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name must be at most 120 characters'],
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: {
        values: ORGANIZATION_INDUSTRIES,
        message: 'Industry must be one of: {VALUES}',
      },
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must be at most 1000 characters'],
      default: '',
    },
    plan: {
      type: String,
      enum: {
        values: ORGANIZATION_PLANS,
        message: 'Plan must be one of: {VALUES}',
      },
      default: 'starter',
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
