import express from "express";
import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "public/images");
//     },
//     filename: (req, file, cb) => {
//       cb(null, req.body.name);
//     },
//   });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: req.body.name,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);

    // const getObjectParams = {
    //   Bucket: bucketName,
    //   Key: req.body.name,
    // };
    // const command = new GetObjectCommand(getObjectParams);

    // const url = await getSignedUrl(s3, command, { expiresIn: 604800 });
    const url = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${req.body.name}`;
    return res.status(200).json(url);
  } catch (error) {
    console.error(error);
  }
});

router.post("/video", upload.single("file"), async (req, res) => {
  try {
    console.log("keriii")
    const params = {
      Bucket: bucketName,
      Key:"videos/" + req.body.name,
      Body:req.file.buffer,
      ContentType:req.file.mimetype,
    }
    const command= new PutObjectCommand(params)
    await s3.send(command)


    // const getObjectParams = {
    //   Bucket: bucketName,
    //   Key:"videos/" + req.body.name,
    // };
    // const command = new GetObjectCommand(getObjectParams);

    // const url = await getSignedUrl(s3, command,{expiresIn:604800});
    const url = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${params.Key}`;
    return res.status(200).json(url);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to upload video." });
  }
});


export default router;
