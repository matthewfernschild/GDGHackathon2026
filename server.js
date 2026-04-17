const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

const storage = new Storage();
const firestore = new Firestore();

const BUCKET_NAME = process.env.BUCKET_NAME;
const bucket = storage.bucket(BUCKET_NAME);

const upload = multer({
  storage: multer.memoryStorage(),
});

app.use(express.static('public'));

const uploadToGCS = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const blob = bucket.file(`${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`);
    const blobStream = blob.createWriteStream({ resumable: false });

    blobStream.on('error', reject);
    blobStream.on('finish', () => {
      resolve(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
    });

    blobStream.end(file.buffer);
  });
};

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
      createdAt: Firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send('Profile successfully uploaded and saved.');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred during upload.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is successfully listening on port ${port}`);
});
