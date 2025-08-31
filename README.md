# Social Network App

A modern social media application built with Next.js 14, TypeScript, Tailwind CSS, and Firebase.

## Features

### 🔐 Authentication
- Google OAuth integration with Firebase Auth
- Automatic user profile creation on first sign-in
- Protected routes for authenticated users

### 📱 User Interface
- Responsive design with Tailwind CSS
- Modern, clean UI with smooth transitions
- Tab navigation between Home, Profile, and Create Post
- Real-time updates for posts and interactions

### 📝 Posts
- Create posts with text content
- Upload and attach images to posts
- Image preview before posting
- File validation (image types, size limits)
- Delete posts (author only)

### ❤️ Interactions
- Like/unlike posts
- Add comments to posts
- Delete comments (author or post owner)
- Real-time like and comment counts

### 👤 User Profiles
- Customizable display name and bio
- Profile editing functionality
- View user's posts
- Statistics (posts, total likes, total comments)
- Member since date

### 🏠 Home Feed
- Display all posts from all users
- Real-time updates when new posts are created
- Chronological order (newest first)
- Welcome screen for non-authenticated users

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## Project Structure

```
src/
├── app/
│   ├── create/
│   │   └── page.tsx          # Create Post page
│   ├── profile/
│   │   └── page.tsx          # User Profile page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout with AuthProvider
│   └── page.tsx              # Home page with feed
├── components/
│   ├── CreatePost.tsx        # Post creation component
│   ├── Navigation.tsx        # Main navigation
│   └── Post.tsx              # Individual post component
└── lib/
    ├── firebase/
    │   ├── firebase.ts       # Firebase configuration
    │   └── firebaseUtils.ts  # Firebase utility functions
    ├── contexts/
    │   └── AuthContext.tsx   # Authentication context
    ├── hooks/
    │   └── useAuth.ts        # Authentication hook
    └── types.ts              # TypeScript type definitions
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-network-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Google provider
   - Create a Firestore database
   - Enable Storage
   - Add your Firebase configuration to environment variables

4. **Environment Variables**
   Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Sign In**: Click "Sign In" to authenticate with Google
2. **Create Posts**: Use the "Create Post" tab or the form on the home page
3. **Interact**: Like posts and add comments
4. **Manage Profile**: Edit your display name and bio in the Profile tab
5. **View Feed**: See all posts from all users on the Home page

## Features in Detail

### Authentication Flow
- Users sign in with Google OAuth
- User profile is automatically created in Firestore
- Protected routes redirect unauthenticated users to home

### Real-time Updates
- Posts are updated in real-time using Firestore listeners
- Like counts and comments update immediately
- New posts appear instantly in the feed

### Image Handling
- Images are uploaded to Firebase Storage
- File validation ensures only images are uploaded
- 5MB size limit for uploads
- Preview before posting

### Security
- Users can only delete their own posts and comments
- Post authors can delete comments on their posts
- Authentication required for protected actions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.