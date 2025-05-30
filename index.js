import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import { scanTweets } from './lib/scanTweets.js';
import { generateReply } from './lib/generateReply.js';
import { kv } from '@vercel/kv';

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
const rwClient = twitterClient.readWrite;

const MAX_REPLIES_PER_RUN = 3;
const REPLY_COOLDOWN_DAYS = 7;
const SEVEN_DAYS_MS = REPLY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

async function getRecentlyRepliedUsers() {
  const now = Date.now();
  // kv.keys returns all keys in your KV namespace (user IDs)
  const keys = await kv.keys();

  const recentUsers = new Set();
  for (const key of keys) {
    const timestamp = await kv.get(key);
    if (timestamp && now - timestamp < SEVEN_DAYS_MS) {
      recentUsers.add(key);
    } else {
      // Clean old keys outside cooldown
      await kv.del(key);
    }
  }
  return recentUsers;
}

async function saveRepliedUser(userId) {
  await kv.set(userId, Date.now());
}

async function replyToTweets() {
  try {
    const repliedUsers = await getRecentlyRepliedUsers();
    const tweetsToReply = await scanTweets(repliedUsers);

    let replyCount = 0;
    for (const tweet of tweetsToReply) {
      if (replyCount >= MAX_REPLIES_PER_RUN) break;

      // Generate reply text
      const replyText = await generateReply(tweet.text);

      // Post reply to X API
      await rwClient.v2.reply(replyText, tweet.id);

      // Save user ID with timestamp
      await saveRepliedUser(tweet.author_id);

      replyCount++;
      console.log(`Replied to tweet ${tweet.id} by user ${tweet.author_id}`);
    }

    if (replyCount === 0) {
      console.log('No suitable tweets found to reply to today.');
    }
  } catch (error) {
    console.error('Error replying to tweets:', error);
  }
}

// Run it
replyToTweets();

