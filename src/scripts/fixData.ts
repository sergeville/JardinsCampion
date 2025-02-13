// Set environment variables
process.env.MONGODB_URI_DEV =
  'mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin&replicaSet=rs0&directConnection=true&retryWrites=true&w=majority';
process.env.MONGODB_URI_PROD = process.env.MONGODB_URI_DEV;
process.env.NODE_ENV = 'development';

import connectDB from '../lib/mongodb';
import UserModel from '../models/User';
import VoteModel from '../models/Vote';
import LogoModel from '../models/Logo';

async function fixData() {
  try {
    console.log('Starting data fix...');
    await connectDB();

    // Get all confirmed votes
    const confirmedVotes = await VoteModel.find({ status: 'confirmed' }).lean();
    console.log(`Found ${confirmedVotes.length} confirmed votes`);

    // Update users
    const userUpdates = confirmedVotes.reduce((acc: { [key: string]: string[] }, vote) => {
      if (!acc[vote.userId]) {
        acc[vote.userId] = [];
      }
      acc[vote.userId].push(vote.logoId);
      return acc;
    }, {});

    for (const [userId, votedLogos] of Object.entries(userUpdates)) {
      const uniqueVotedLogos = Array.from(new Set(votedLogos));
      await UserModel.updateOne(
        { userId },
        {
          $set: {
            votedLogos: uniqueVotedLogos,
            voteCount: uniqueVotedLogos.length,
          },
        }
      );
      console.log(`Updated user ${userId} with ${uniqueVotedLogos.length} votes`);
    }

    // Update logos
    const logoUpdates = confirmedVotes.reduce(
      (acc: { [key: string]: { voters: string[]; lastVote: Date } }, vote) => {
        if (!acc[vote.logoId]) {
          acc[vote.logoId] = { voters: [], lastVote: vote.timestamp };
        }
        acc[vote.logoId].voters.push(vote.userId);
        if (vote.timestamp > acc[vote.logoId].lastVote) {
          acc[vote.logoId].lastVote = vote.timestamp;
        }
        return acc;
      },
      {}
    );

    for (const [logoId, stats] of Object.entries(logoUpdates)) {
      const uniqueVoters = Array.from(new Set(stats.voters));
      await LogoModel.updateOne(
        { value: logoId },
        {
          $set: {
            'voteStats.totalVotes': stats.voters.length,
            'voteStats.uniqueVoters': uniqueVoters.length,
            'voteStats.lastVoteAt': stats.lastVote,
          },
        }
      );
      console.log(
        `Updated logo ${logoId} with ${stats.voters.length} votes from ${uniqueVoters.length} unique voters`
      );
    }

    console.log('Data fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing data:', error);
    process.exit(1);
  }
}

fixData();
