const mongoose = require('mongoose');
const Movie = require('./models/movie');

// MongoDB connection with better error handling
mongoose.connect('mongodb://localhost:27017/social_media_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 second timeout
  socketTimeoutMS: 45000, // 45 second timeout
}).then(() => {
  console.log('Connected to MongoDB successfully!');
}).catch((error) => {
  console.error('MongoDB connection error:', error.message);
  console.log('Please make sure MongoDB is running on localhost:27017');
  process.exit(1);
});

const sampleMovies = [
  {
    title: 'Avengers: Endgame',
    description: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.',
    releaseYear: 2019,
    duration: 181,
    genres: ['Action', 'Adventure', 'Drama', 'Sci-Fi'],
    country: 'United States',
    language: 'English',
    director: 'Anthony Russo, Joe Russo',
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo', 'Chris Hemsworth', 'Scarlett Johansson'],
    rating: 8.4,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    quality: '4K Ultra HD',
    views: 2500000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: false,
    isPopular: true,
    tags: ['marvel', 'superhero', 'avengers', 'thanos', 'infinity stones'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Spider-Man: No Way Home',
    description: 'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear, forcing Peter to discover what it truly means to be Spider-Man.',
    releaseYear: 2021,
    duration: 148,
    genres: ['Action', 'Adventure', 'Fantasy', 'Sci-Fi'],
    country: 'United States',
    language: 'English',
    director: 'Jon Watts',
    cast: ['Tom Holland', 'Zendaya', 'Benedict Cumberbatch', 'Willem Dafoe', 'Alfred Molina'],
    rating: 8.2,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    quality: '4K Ultra HD',
    views: 1800000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: true,
    isPopular: true,
    tags: ['spiderman', 'marvel', 'multiverse', 'doctor strange', 'villains'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Black Panther: Wakanda Forever',
    description: 'The people of Wakanda fight to protect their home from intervening world powers as they mourn the death of King T\'Challa.',
    releaseYear: 2022,
    duration: 161,
    genres: ['Action', 'Adventure', 'Drama', 'Sci-Fi'],
    country: 'United States',
    language: 'English',
    director: 'Ryan Coogler',
    cast: ['Letitia Wright', 'Lupita Nyong\'o', 'Danai Gurira', 'Winston Duke', 'Angela Bassett'],
    rating: 6.7,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=_Z3QKkl1WyM',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    quality: '4K Ultra HD',
    views: 1200000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: true,
    isPopular: false,
    tags: ['black panther', 'wakanda', 'marvel', 'shuri', 'namor'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'The Batman',
    description: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.',
    releaseYear: 2022,
    duration: 176,
    genres: ['Action', 'Crime', 'Drama', 'Mystery'],
    country: 'United States',
    language: 'English',
    director: 'Matt Reeves',
    cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano', 'Jeffrey Wright', 'Colin Farrell'],
    rating: 7.8,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    quality: '4K Ultra HD',
    views: 900000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: true,
    isPopular: false,
    tags: ['batman', 'gotham', 'riddler', 'catwoman', 'detective'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Top Gun: Maverick',
    description: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN\'s elite graduates on a mission that demands the ultimate sacrifice.',
    releaseYear: 2022,
    duration: 130,
    genres: ['Action', 'Drama'],
    country: 'United States',
    language: 'English',
    director: 'Joseph Kosinski',
    cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly', 'Jon Hamm', 'Glen Powell'],
    rating: 8.3,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=giXco2jaZ_4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    quality: '4K Ultra HD',
    views: 1600000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: true,
    isPopular: true,
    tags: ['top gun', 'fighter jets', 'navy', 'maverick', 'action'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Dune',
    description: 'Feature adaptation of Frank Herbert\'s science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset and most vital element in the galaxy.',
    releaseYear: 2021,
    duration: 155,
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    country: 'United States',
    language: 'English',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Rebecca Ferguson', 'Oscar Isaac', 'Jason Momoa', 'Zendaya'],
    rating: 8.0,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=n9xhJrPXop4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    quality: '4K Ultra HD',
    views: 800000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: false,
    isPopular: false,
    tags: ['dune', 'sci-fi', 'arrakis', 'spice', 'frank herbert'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'No Time to Die',
    description: 'James Bond has left active service. His peace is short-lived when Felix Leiter, an old friend from the CIA, turns up asking for help, leading Bond onto the trail of a mysterious villain armed with dangerous new technology.',
    releaseYear: 2021,
    duration: 163,
    genres: ['Action', 'Adventure', 'Thriller'],
    country: 'United Kingdom',
    language: 'English',
    director: 'Cary Joji Fukunaga',
    cast: ['Daniel Craig', 'Ana de Armas', 'Rami Malek', 'Léa Seydoux', 'Lashana Lynch'],
    rating: 7.3,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=BIhNsAtPbPI',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    quality: '4K Ultra HD',
    views: 1100000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: false,
    isPopular: true,
    tags: ['james bond', '007', 'spy', 'action', 'daniel craig'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Parasite',
    description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    releaseYear: 2019,
    duration: 132,
    genres: ['Comedy', 'Drama', 'Thriller'],
    country: 'South Korea',
    language: 'Korean',
    director: 'Bong Joon-ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik', 'Park So-dam'],
    rating: 8.6,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=5xH0HfJHsaY',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMobsters.mp4',
    quality: '4K Ultra HD',
    views: 800000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: false,
    isPopular: false,
    tags: ['social commentary', 'class struggle', 'dark comedy', 'korean cinema'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Demon Slayer: Mugen Train',
    description: 'After a string of mysterious disappearances begin to plague a train, the Demon Slayer Corps\' multiple attempts to remedy the problem prove fruitless.',
    releaseYear: 2020,
    duration: 117,
    genres: ['Animation', 'Action', 'Adventure', 'Fantasy'],
    country: 'Japan',
    language: 'Japanese',
    director: 'Haruo Sotozaki',
    cast: ['Natsuki Hanae', 'Akari Kitō', 'Hiro Shimono', 'Yoshitsugu Matsuoka'],
    rating: 8.2,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=ATJYac_dORw',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    quality: '4K Ultra HD',
    views: 600000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: false,
    isPopular: false,
    tags: ['anime', 'demon slayer', 'japanese animation', 'action'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Shang-Chi and the Legend of the Ten Rings',
    description: 'Shang-Chi, the master of weaponry-based Kung Fu, is forced to confront his past after being drawn into the Ten Rings organization.',
    releaseYear: 2021,
    duration: 132,
    genres: ['Action', 'Adventure', 'Fantasy'],
    country: 'United States',
    language: 'English',
    director: 'Destin Daniel Cretton',
    cast: ['Simu Liu', 'Awkwafina', 'Tony Leung', 'Michelle Yeoh', 'Meng\'er Zhang'],
    rating: 7.4,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    trailer: 'https://www.youtube.com/watch?v=8YjFbMbfXaQ',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    quality: '4K Ultra HD',
    views: 950000,
    likes: [],
    dislikes: [],
    comments: [],
    isRecommended: true,
    isNew: false,
    isPopular: false,
    tags: ['shang-chi', 'marvel', 'kung fu', 'ten rings', 'asian representation'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createSampleMovies() {
  try {
    console.log('Starting to create sample movies...');
    
    // Check if movies already exist
    const existingCount = await Movie.countDocuments();
    console.log(`Found ${existingCount} existing movies in database`);
    
    if (existingCount > 0) {
      console.log('Movies already exist in database. Skipping creation.');
      process.exit(0);
    }

    // Clear existing movies (if any)
    console.log('Clearing existing movies...');
    await Movie.deleteMany({});
    console.log('Cleared existing movies');

    // Insert new movies
    console.log('Inserting sample movies...');
    const createdMovies = await Movie.insertMany(sampleMovies);
    console.log(`Created ${createdMovies.length} sample movies`);

    // Create text index for search
    console.log('Creating text index for search...');
    await Movie.collection.createIndex({ 
      title: 'text', 
      description: 'text', 
      director: 'text', 
      cast: 'text',
      tags: 'text'
    });
    console.log('Created text index for search');

    console.log('✅ Sample movies created successfully!');
    console.log('🎬 You can now browse movies in your app!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample movies:', error.message);
    if (error.name === 'MongoNetworkError') {
      console.log('💡 Make sure MongoDB is running on localhost:27017');
    }
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Process interrupted. Closing connection...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  });
});

createSampleMovies(); 