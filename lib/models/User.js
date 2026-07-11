import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20 },
  password: { type: String, required: true },
  chips:    { type: Number, default: 1000 }
});

export default mongoose.models.User ?? mongoose.model('User', UserSchema);