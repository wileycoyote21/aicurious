import { TwitterApi } from 'twitter-api-v2';

// Load env vars with your keys
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

const keywords = [
  '"ai is scary"',
  '"chatgpt changed my mind"',
  '"robots are taking over"',
  '"i\'m scared of ai"',
];

// Helper to build query string for Twitter recent search API
function buildQuery() {
  return keywords.join(' OR ') + ' -is:retweet -is:reply lang:en';
}

export async function scanTweets(repliedUsersSet) {
  const query = buildQuery();

  const { data: tweets } = await twitterClient.v2.search(query, {
    max_results: 50, // fetch up to 50 recent tweets matching query
    'tweet.fields': 'public_metrics,author_id,created_at',
  });

  if (!tweets) return [];

  // Filter tweets by engagement and filter out users replied recently
  const filteredTweets = tweets.filter((tweet) => {
    const likes = tweet.public_metrics?.like_count || 0;
    if (likes < 2 || likes > 50) return false;
    if (repliedUsersSet.has(tweet.author_id)) return false;
    return true;
  });

  // Return up to 3 tweets max
  return filteredTweets.slice(0, 3);
}
