# Cine Seeker

## Project Overview

Cine Seeker is a modern web application that allows users to discover, search, and explore movies. With a beautiful and responsive UI, users can browse trending films, view detailed movie information, and manage their personal watchlist. Cine Seeker is built for movie enthusiasts who want a seamless and interactive experience.

## Features

- Browse trending, popular, and top-rated movies
- Search for movies by title, genre, or release year
- View detailed information for each movie (synopsis, cast, ratings, trailers, etc.)
- Add movies to your personal watchlist
- Responsive design for mobile and desktop
- Fast and interactive UI with instant feedback

## Technologies Used

- **Vite** – Lightning-fast build tool
- **TypeScript** – Type safety for robust development
- **React** – Component-based UI
- **shadcn-ui** – Beautiful, accessible UI components
- **Tailwind CSS** – Utility-first CSS framework
- **Radix UI** – Accessible React primitives
- **React Router** – Client-side routing
- **Axios** – HTTP client for API requests
- **Express & Mongoose** – REST API and MongoDB integration

## Getting Started

To run Cine Seeker locally, make sure you have Node.js & npm installed.

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>

# 2. Navigate to the project directory
cd cine-seeker

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

## Deployment

You can deploy Cine Seeker using your favorite platform (Vercel, Netlify, etc.) or by following the instructions in your deployment provider's documentation.

## Customization

- To connect to a movie database API (such as TMDB), add your API key to a `.env` file:
  ```env
  VITE_MOVIE_API_KEY=your_api_key_here
  ```
- For backend features (watchlist, authentication), ensure your backend server is running and update API endpoints as needed.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the app.

## License

This project is licensed under the MIT License.
