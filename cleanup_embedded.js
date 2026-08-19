import mongoose from 'mongoose';
mongoose.connect('mongodb://shardaacademy:sudeep1234567890@ac-lhdvioz-shard-00-00.oywpocn.mongodb.net:27017,ac-lhdvioz-shard-00-01.oywpocn.mongodb.net:27017,ac-lhdvioz-shard-00-02.oywpocn.mongodb.net:27017/sharda-academy?ssl=true&replicaSet=atlas-f8ixp1-shard-0&authSource=admin&appName=shardaacademy');
const db = mongoose.connection;
db.once('open', async () => {
  try {
    const res = await db.collection('students').updateMany({}, {
      $pull: {
        fees: { title: { $regex: '^TEST_' } },
        homework: { title: { $regex: '^TEST_' } },
        results: { examName: { $regex: '^TEST_' } },
        notices: { title: { $regex: '^TEST_' } },
        timetable: { teacher: { $regex: '^Test' } }
      }
    });
    console.log('Cleaned embedded arrays in', res.modifiedCount, 'students');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
});
