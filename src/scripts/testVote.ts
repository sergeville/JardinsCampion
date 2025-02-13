// Set environment variables
process.env.MONGODB_URI_DEV =
  'mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin&replicaSet=rs0&directConnection=true&retryWrites=true&w=majority';
process.env.MONGODB_URI_PROD = process.env.MONGODB_URI_DEV;
process.env.NODE_ENV = 'development';

import { submitVote } from '@/app/actions';
import '@/lib/mongodb';

async function testVote() {
  try {
    console.log('Starting vote test...');
    console.log('Using MongoDB URI:', process.env.MONGODB_URI_DEV);

    const voteData = {
      userId: 'serge',
      logoId: '3',
      ownerId: 'serge-villeneuve',
    };

    console.log('Submitting vote with data:', voteData);

    const result = await submitVote(voteData);

    console.log('Vote submission result:', result);

    process.exit(0);
  } catch (error) {
    console.error('Error in test vote:', error);
    process.exit(1);
  }
}

testVote();
