# JobHunt Backend

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=8000
   SECRET_KEY=your-secret-key-here
   MONGO_URI=your-mongodb-connection-string
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

## API Endpoints

- **User Routes**: `/api/v1/user`
- **Job Routes**: `/api/v1/job`
- **Company Routes**: `/api/v1/company`
- **Application Routes**: `/api/v1/application`

## Notes

- The server runs on port 8000 by default
- Make sure MongoDB is running and accessible
- Cloudinary is required for file uploads 