import multer from 'multer';

const storage = multer.memoryStorage();
export const singleUpload = multer({storage}).single("file");

// For profile updates with multiple files
export const profileUpload = multer({storage}).fields([
    { name: 'profilePhotoFile', maxCount: 1 },
    { name: 'resumeFile', maxCount: 1 }
]);