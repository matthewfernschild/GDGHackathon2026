const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const path = require('path');

const app = express();

// 1. Tell Express to serve your styled files and index.html
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ai_studio_code.html')); // Use the styled file
});

// 2. Setup Cloud Services
const storage = new Storage();
const firestore = new Firestore();
const BUCKET_NAME = process.env.BUCKET_NAME;

// 3. Setup Multer (handles file uploads in memory)
const upload = multer({
  storage: multer.memoryStorage(),
});

const uploadToGCS = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const bucket = storage.bucket(BUCKET_NAME);
    const blob = bucket.file(`${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`);
    const blobStream = blob.createWriteStream({ resumable: false });

    blobStream.on('error', reject);
    blobStream.on('finish', () => {
      resolve(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
    });

    blobStream.end(file.buffer);
  });
};

// 4. The Upload Route
app.post('/upload', upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'resumePdf', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, email } = req.body;

    const profilePictureUrl = req.files['profilePicture'] ? await uploadToGCS(req.files['profilePicture'][0]) : null;
    const resumePdfUrl = req.files['resumePdf'] ? await uploadToGCS(req.files['resumePdf'][0]) : null;

    const docRef = firestore.collection('users').doc();
    await docRef.set({
      name,
      email,
      profilePictureUrl,
      resumePdfUrl,
      createdAt: new Date()
    });

    res.status(200).send('<h1>Success!</h1><p>Profile uploaded and saved to Firestore.</p><a href="/">Go Back</a>');
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).send('An error occurred during upload. Check Cloud Run logs for details.');
  }
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is successfully listening on port ${port}`);
});