import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const checkPassword = (password, passwordConfirm) => {
  // Simple equality check for password confirmation
  return password === passwordConfirm;
};

export const hashPassword = async (password) => {
  // Hash password with bcrypt (12 salt rounds)
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (candidatePassword, userPassword) => {
  // Compare plaintext candidate with hashed user password
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const changedPasswordAfter = (passwordChangedAt, JWTTimestamp) => {
  if (passwordChangedAt) {
    const changedTimestamp = parseInt(passwordChangedAt.getTime() / 1000, 10);
    // Return true if jwt was issued before the password was changed
    return JWTTimestamp < changedTimestamp;
  }

  // False means not changed
  return false;
};

export const createPasswordResetToken = async function (userId) {
  const token = crypto.randomBytes(32).toString("hex");

  // Store a hashed version of the token and expiry in db return plaintext token
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: crypto
        .createHash("sha256")
        .update(token)
        .digest("hex"),
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return token;
};
