import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new Schema(
  {
    name: {
      required: true,
      type: String,
    },
    email: {
      required: true,
      unique: true,
      type: String,
      lowercase: true,
      trim: true,
    },

    password: {
      required: true,
      type: String,
    },
  },
  { timestamps },
);

// hash the password
UserSchema.pre("save", async () => {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.hash(this.password, salt);
});

// compare password method
UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", UserSchema);
