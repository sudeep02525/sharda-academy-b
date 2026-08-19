import mongoose from 'mongoose';
mongoose.connect('mongodb://shardaacademy:sudeep1234567890@ac-lhdvioz-shard-00-00.oywpocn.mongodb.net:27017,ac-lhdvioz-shard-00-01.oywpocn.mongodb.net:27017,ac-lhdvioz-shard-00-02.oywpocn.mongodb.net:27017/sharda-academy?ssl=true&replicaSet=atlas-f8ixp1-shard-0&authSource=admin&appName=shardaacademy');
const db = mongoose.connection;
db.once('open', async () => {
  try {
    const resUsers = await db.collection('users').deleteMany({ name: { $regex: '^TEST_' } });
    const resStudents = await db.collection('students').deleteMany({ 'personalInfo.fullName': { $regex: '^TEST_' } });
    console.log('Deleted Users:', resUsers.deletedCount);
    console.log('Deleted Students:', resStudents.deletedCount);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
});
