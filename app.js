const express = require("express");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const { default: axios } = require("axios");
const app = express();

// Create S3 instance
const s3 = new AWS.S3();

//  Configure multer to use S3 storage
const storageS3 = multerS3({
  s3: s3,
  bucket: "yanovitsky-demo1-s3",
  contentType: (req, file, cb) => {
    cb(null, file.mimetype);
  },
  key: function (req, file, cb) {
    // Use the fieldname of the file combined with the original file extension
    const extension = path.extname(file.originalname);

    let imagename = req.body.imagename
      ? req.body.imagename
      : Date.now() + "-" + file.originalname;

    // Check if the provided imagename includes an extension
    if (!path.extname(imagename)) {
      // If not, append the extension from the original imagename
      imagename += extension;
    }

    cb(null, imagename);
  },
});

// Create the multer instance
const upload = multer({ storage: storageS3 });

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

app.get("/myip", async (req, res) => {
  try {
    const response = await axios.get('https://ipinfo.io/ip');
    const publicIp = response.data.trim(); // Trim to remove any whitespace
    res.send(`Public IP Address of the EC2 instance: ${publicIp}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving public IP');
  }
});

// Route to handle file upload
app.post("/", upload.single("image"), (req, res) => {
  // Check if request contains file
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  return res.send("File uploaded.");
});

// Start the server
const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});