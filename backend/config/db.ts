import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined');

  try {
    await mongoose.connect(uri).then(() => {
      console.log('Connected to the database successfully!');
    });
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};
